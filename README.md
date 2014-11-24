:warning: *Use of this software is subject to important terms and conditions as set forth in the License file* :warning:

# URL Builder App

A Zendesk App to help you generate links for agents.

# Instructions

1. Download a [.zip of this app](https://github.com/zendesklabs/url_builder_app/archive/master.zip)
2. Navigate to your Zendesk Admin's Apps -> Manage page
3. Click `Upload App`
4. Enter a descriptive name of your choosing, and upload this .zip
5. Click `Upload`
6. Confirm the title, the second box is for the `json`, described below.
7. Optionally enable role restrictions if these URLs are not appropriate for all agents.
8. Once your .json is in place, click `Install`.
9. Open a new browser to test your results.

# JSON Array of URLs

The following is an example of what can be entered into this app's settings:

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

This example will generate the following HTML inside the app:
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

### Available Placeholder
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
* {{ticket.custom_field_XXXXXXX}} // XXXXXXX = custom field id
* {{ticket.organization.organization_fields.XXXXXXX}} // XXXXXXX = Field key, default is field name
* {{current_user.id}}
* {{current_user.name}}
* {{current_user.email}}
* {{current_user.externalId}}
* {{current_user.firstname}}
* {{current_user.lastname}}

### Making changes

If you wish to change the output, locate the app by looking for the name you choose in step 4 above. Use the widget to `Change Settings`

<img width="195" src="https://github.com/watchmanmonitoring/url_builder_app/raw/master/assets/app-settings-change.png" />


## Contribution

Improvements are always welcome. To contribute, please submit detailed Pull Requests.

