/**
 * Retrieves and returns PagerDuty incident counts.
 *
 * @see https://github.com/kmart2234/node-pagerduty
 * @see https://v2.developer.pagerduty.com/v2/page/api-reference
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const PAGERDUTY_API_KEY = process.env.PAGERDUTY_API_KEY;
const NodePagerDuty = require( 'node-pagerduty' );

/**
 * Retrieves incident counts from PagerDuty - both active incidents (those in a 'triggered' or
 * 'acknowledged' state), and un-acknowledged incidents (just those in a 'triggered' state).
 *
 * @returns {object} An object containing counts under 'all' and 'unacked' properties.
 */
const getIncidents = async () => {

  const pagerDuty = new NodePagerDuty( PAGERDUTY_API_KEY );

  const [ all, unacked ] = await Promise.all([
    pagerDuty.incidents.listIncidents({ statuses: [ 'triggered', 'acknowledged' ] }),
    pagerDuty.incidents.listIncidents({ statuses: [ 'triggered' ] })
  ]);

  return {
    all: JSON.parse( all.body ).incidents.length,
    unacked: JSON.parse( unacked.body ).incidents.length,
  };

}; // GetIncidents.

module.exports = {
  getIncidents
};
