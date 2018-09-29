/**
 * Updates a Slack channel topic with key stats from monitored services (currently Jira and
 * PagerDuty issue/incident counts).
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const JIRA_BLOCKERS_DESCRIPTION = process.env.JIRA_BLOCKERS_DESCRIPTION || 'blockers',
      SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID,
      SLACK_OAUTH_TOKEN = process.env.SLACK_OAUTH_TOKEN;

const jira = require( './jira' ),
      pagerduty = require( './pagerduty' ),
      slackTopicUpdater = require( 'slack-topic-updater' );

/**
 * Handles incoming invocations.
 *
 * @param {express.req} request An Express request. See https://expressjs.com/en/4x/api.html#req.
 * @param {express.res} response An Express response. See https://expressjs.com/en/4x/api.html#res.
 */
const handler = async ( request, response ) => {

  console.log( 'Retrieving Jira issues and PagerDuty incidents...' );

  try {

    const [issues, incidents] = await Promise.all([
      jira.getIssues().catch( console.error ),
      pagerduty.getIncidents().catch( console.error )
    ]);

    if ( ! issues && ! incidents ) {

      const message = (
        'Both Jira issues and PagerDuty incidents cannot be accessed. Your channel topic ' +
        'will not be changed.'
      );

      response.send( message );
      console.error( message );
      return;

    }

    let topic = '';

    // Add Jira issues to the new topic string.
    if ( issues ) {
      console.log( issues );
      topic += issues.all + ' issues';
      topic += issues.blockers ? ', ' + issues.blockers + ' ' + JIRA_BLOCKERS_DESCRIPTION : '';
    }

    topic += issues && incidents ? ' | ' : '';

    // Add PagerDuty incidents to the new topic string.
    if ( incidents ) {
      console.log( incidents );
      topic += incidents.all + ' incidents';
      topic += incidents.unacked ? ', ' + incidents.unacked + ' unack\'ed' : '';
    }

    console.log( 'Updating topic for ' + SLACK_CHANNEL_ID + ' to "' + topic + '"...' );

    // Use slack-topic-updater to update the topic and clear the topic update message.
    return slackTopicUpdater.update({
      token: SLACK_OAUTH_TOKEN,
      channel: SLACK_CHANNEL_ID,
      topic: topic
    }).then( ( data ) => {

      if ( data.ok ) {
        response.send( 'Done.' );
        console.log( 'Done.' );
        return;
      }

      console.error( 'An error occurred updating the Slack topic.' );
      console.error( data );

    });

  } catch ( error ) {
    response.send( 'An error occurred.' );
    console.error( error );
  }

}; // Handler.

module.exports = {
  handler
};
