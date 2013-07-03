Links App - Url Builder
=========

A Zendesk App to help you generate links for agents.

You'll need to provide a template for the links, here's an example:
```javascript
[
  {
    "title": "First Title",
    "url": "http://example.com/?name={{ticket.requester.name}}"
  },
  {
    "title": "Second Title (with custom field)",
    "url": "http://example.com/?custom={{ticket.custom_field_424242}}"
  }
]
```
This example will generate the following Html inside the app:
```html
<ul>
  <li>
    <a href="http://example.com/?name=Robert C.Martin">First Title</a>
  </li>
  <li>
    <a href="http://example.com/?custom=secretRocketLaunchCodes">Second Title (with custom field)</a>
  </li>
</ul>
```


## Available Variables
* {{ticket.requester.id}}
* {{ticket.requester.name}}
* {{ticket.requester.email}}
* {{ticket.requester.externalId}}
* {{ticket.requester.firstname}}
* {{ticket.requester.lastname}}
* {{ticket.assignee.user.id}}
* {{ticket.assignee.user.name}}
* {{ticket.assignee.user.email}}
* {{ticket.assignee.user.externalId}}
* {{ticket.assignee.user.firstname}}
* {{ticket.assignee.user.lastname}}
* {{ticket.assignee.group.id}}
* {{ticket.assignee.group.name}}
* {{ticket.custom_field_XXXXXXX}}
* {{current_user.id}}
* {{current_user.name}}
* {{current_user.email}}
* {{current_user.externalId}}
* {{current_user.firstname}}
* {{current_user.lastname}}

## Contribution

Improvements are always welcome. To contribute, please submit detailed Pull Requests.
