import { getTicketData } from "../lib/api";

const TEMPLATE_OPTIONS = { interpolate: /\{\{(.+?)\}\}/g };

/**
 * Parses a Zendesk users first and last name
 * from their Full name
 *
 * TODO: Docz
 *
 * @param {Object} user - A Zendesk User Object
 */
export function parseFirstLastName(user) {
  const [first_name = '', last_name = ''] = (user.name || '').split(' ');

  return {
    ...user,
    first_name,
    last_name,
  };
}

// TODO: Hook into on change app/init idk
var fieldsToWatch = _.memoize(function() {
  getUriTemplatesFromAppData().then(uri_templates => {
    console.log('fieldsToWatch templates: ', uri_templates);
    return _.reduce(uri_templates, function (memo, uri) {
      let fields = _.map(uri.url.match(/\{\{(.+?)\}\}/g), function (f) { return f.slice(2, -2); });

      console.log('fieldsToWatch fields: ', fields);
      console.log('fieldsToWatch return: ', _.union(memo, fields));
      return _.union(memo, fields);
    }, []);
  }, error => {
    throw error;
  });
});

/**
 * TODO: JS DOcs
 * @param {*} settings - blah
 */
export function getUrisFromSettings({ uri_templates }) {
  return JSON.parse(uri_templates);
};

/**
 * TODO: JS DOcs
 * @param {*} uris 
 * @param {*} context 
 */
export function buildTemplatesFromContext(uris, context) {
  return _.map(uris, uri => {
    try {
      uri.url = _.template(uri.url, TEMPLATE_OPTIONS)(context)
      uri.title = _.template(uri.title, TEMPLATE_OPTIONS)(context)
    } catch (e) {
      console.error('Error occurred with URIs: ', e)
    }
    return uri
  });
}

/**
 * TODO: JS DOcs
 * @param {*} ticket 
 */
function assignTicketFields(ticket, ticketFields) {
  const ticketCopy = Object.assign({}, ticket);

  ticketFields.ticket.custom_fields.forEach(custom_field => {
    ticketCopy[`custom_field_${custom_field.id}`] = custom_field.value
  });

  return ticketCopy;
}

/**
 * TODO: JS DOcs
 * @param {*} user 
 */
function parseFirstLastName(user) {
  const [first_name = '', last_name = ''] = (user.name || '').split(' ');

  return {
    ...user,
    first_name,
    last_name,
  };
}

/**
 * TODO: JS DOcs
 */
async function getContext(client) {
  function buildContext(ticket, currentUser) {
    let context = {};
    context.ticket = ticket;

    if (ticket.requester.id) {
      context.ticket.requester = parseFirstLastName(ticket.requester);

      /*
        // TODO: Look into organizations
        // this should be ticket.requester.organization_id
        if (context.ticket.requester.organization_id) {
          context.ticket.organization = _.find(data.organizations, org => {
            return org.id = context.ticket.requester.organization_id;
          });
        }
       */
    }

    if (ticket.assignee.id) {
      context.ticket.assignee.user = parseFirstLastName(ticket.assignee);
    }

    context.current_user = parseFirstLastName(currentUser);

    return context;
  };

  const { currentUser } = await client.get('currentUser');
  let { ticket } = await client.get('ticket');
  const ticketFields = await client.request(getTicketData(ticket.id));

  ticket = assignTicketFields(ticket, ticketFields);

  return buildContext(ticket, currentUser)
}

export default getContext;