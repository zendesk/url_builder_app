import { templatingLoop as loop, escapeSpecialChars as escape } from '../javascripts/lib/helpers.js'

function uriMarkup (uri) {
  return (`
    <li>
      <strong class="u-font-family-system u-semibold">
        <a href="{{${uri.url}}}" target="_blank" class="btn">{{${uri.title}}}</a>
      </strong>
    </li>
  `);
}

export default function (templateUris) {
  return (`
    <div class="well well-small">
      <ul class="u-list-style-none">${loop(templateUris, uriMarkup)}</ul>
    </div>
  `);
}
