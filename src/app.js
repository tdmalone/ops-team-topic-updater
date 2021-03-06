/**
 * Updates a Slack channel topic with key stats from monitored services (currently Jira and
 * PagerDuty issue/incident counts).
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const JIRA_BLOCKERS_DESCRIPTION = process.env.JIRA_BLOCKERS_DESCRIPTION || 'blocker|blockers',
      SLACK_CHANNEL_IDS = process.env.SLACK_CHANNEL_IDS.split( ',' ),
      SLACK_OAUTH_TOKEN = process.env.SLACK_OAUTH_TOKEN;

const jira = require( './jira' ),
      pagerduty = require( './pagerduty' ),
      helpers = require( './helpers' ),
      slackTopicUpdater = require( 'slack-topic-updater' );

/**
 * Handles incoming invocations.
 *
 * @param {express.req} request An Express request. See https://expressjs.com/en/4x/api.html#req.
 * @param {express.res} response An Express response. See https://expressjs.com/en/4x/api.html#res.
 */
const handler = async ( request, response ) => {

  console.log( 'Retrieving Jira issues and PagerDuty incidents...' );

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
    topic += helpers.maybePluralise( issues.all, 'issue' );

    if ( issues.blockers ) {
      const blockersTerms = JIRA_BLOCKERS_DESCRIPTION.split( '|' );
      const singular = blockersTerms[0];
      const plural = blockersTerms[1] ? blockersTerms[1] : singular;
      topic += ', ';
      topic += helpers.maybePluralise( issues.blockers, singular, plural );
    }
  }

  topic += issues && incidents ? ' | ' : '';

  // Add PagerDuty incidents to the new topic string.
  if ( incidents ) {
    console.log( incidents );
    topic += helpers.maybePluralise( incidents.all, 'incident' );

    if ( incidents.unacked ) {
      topic += ', ' + incidents.unacked + ' unack\'ed';
    }
  }

  const promises = [];

  console.log(
    'Updating topic for ' + SLACK_CHANNEL_IDS.join( ', ' ) + ' to "' + topic + '"...'
  );

  // Use slack-topic-updater to update the topics and clear the topic update messages.
  return slackTopicUpdater.update({
    token: SLACK_OAUTH_TOKEN,
    channels: SLACK_CHANNEL_IDS,
    topic: topic
  }).then( ( data ) => {

    response.send( 'Done.' );
    console.log( 'Done.' );

  }).catch( ( error ) => {

    response.send( 'An error occurred. See the logs for further details.' );
    console.error( 'Errors occurred updating one or more Slack channel topics.' );
    console.error( error );

  });

}; // Handler.

module.exports = {
  handler
};
