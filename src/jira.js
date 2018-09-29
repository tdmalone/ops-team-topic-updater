/**
 * Retrieves and returns issue counts from two Jira filters.
 *
 * @see http://floralvikings.github.io/jira-connector/
 * @see https://developer.atlassian.com/server/jira/platform/rest-apis/
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/7.12.0/
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const JIRA_BLOCKERS_FILTER_ID = process.env.JIRA_BLOCKERS_FILTER_ID,
      JIRA_HOST = process.env.JIRA_HOST,
      JIRA_ISSUES_FILTER_ID = process.env.JIRA_ISSUES_FILTER_ID,
      JIRA_PASSWORD = process.env.JIRA_PASSWORD,
      JIRA_USERNAME = process.env.JIRA_USERNAME;

const JiraConnector = require( 'jira-connector' );

/**
 * Attempts to more gracefully handle errors encountered while connecting to Jira.
 *
 * @param {string} error The error message returned by jira-connector. Expected to be a JSON string
 *                       that, after parsing, contains at least a 'body' property.
 */
const errorHandler = ( error ) => {
  let data;

  // Jira-connector will return an error as a JSON string. If we can parse it, we can get more
  // useful information from Jira.
  try {
    data = JSON.parse( error );
  } catch {
    console.error( 'An unknown error occurred.' );
    console.error( error );
    return;
  }

  const body = data.body.errorMessages || data.body
    .replace( /<script(.|\s)*?>(.|\s)*?<\/script>/ig, '' ) // Remove <script> contents.
    .replace( /<[^>]+>/g, '' )                             // Remove all other tags.
    .replace( /\s+/g, ' ' )                                // Remove leftover whitespace.
    .replace( /&quot;/g, '"' )                             // Replace common HTML entities.
    .trim();

  throw new Error(
    'An error occurred connecting to Jira.' + '\n' +
    'Jira returned: ' + data.statusCode + ' ' + body
  );

}; // ErrorHandler.

/**
 * Retrieves issue counts from two Jira filters - designed to be an 'all' filter and a 'blockers'
 * filter.
 *
 * @returns {object} An object containing counts under 'all' and 'blockers' properties.
 */
const getIssues = async () => {

  const jira = new JiraConnector( {
    host: JIRA_HOST,
    basic_auth: {
      username: JIRA_USERNAME,
      password: JIRA_PASSWORD
    }
  });

  let all, blockers;

  try {

    // Retrieve data on the supplied filters.
    const [ filterAll, filterBlockers ] = await Promise.all([
      jira.filter.getFilter({ filterId: JIRA_ISSUES_FILTER_ID }),
      jira.filter.getFilter({ filterId: JIRA_BLOCKERS_FILTER_ID })
    ]);

    // Do issue searches with the JQL provided by the filters.
    [ all, blockers ] = await Promise.all([
      jira.search.search({ jql: filterAll.jql }),
      jira.search.search({ jql: filterBlockers.jql })
    ]);

  } catch ( error ) {
    errorHandler( error );
  }

  return {
    all: all.total,
    blockers: blockers.total
  };

}; // GetIssues.

module.exports = {
  errorHandler,
  getIssues
};
