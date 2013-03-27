Links App
=========

A Zendesk App to help you generate links for agents.

You'll need to provide a template for the links, here's an example:
```javascript
[
  {
    "title": "First Title",
    "url": "http://example.com/?name={{requester.name}}"
  },
  {
    "title": "Second Title (with custom field)",
    "url": "http://example.com/?custom={{custom_field_424242}}"
  },
  {
    "title": "Third Title (with encode to true)",
    "url": "http://example.com/?email={{requester.email}}",
    "encode": true
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
  <li>
    <a href="http://example.com/?email=user%40domain.com">Third Title (with encode to true)</a>
  </li>
</ul>
```


## Available Variables
* {{requester.id}}
* {{requester.name}}
* {{requester.email}}
* {{requester.externalId}}
* {{assignee.id}}
* {{assignee.name}}
* {{assignee.email}}
* {{assignee.externalId}}
* {{current_user.id}}
* {{current_user.name}}
* {{current_user.email}}
* {{current_user.externalId}}
* {{custom_field_XXXXXXX}}

## Contribution

Improvements are always welcome. To contribute, please submit detailed Pull Requests.
