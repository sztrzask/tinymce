import 'tinymce/themes/silver/Theme';

import { Assertions, Chain, FocusTools, Guard, Keyboard, Keys, Log, Pipeline, UiFinder, Waiter } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock';
import { document } from '@ephox/dom-globals';
import { TinyApis, TinyLoader, TinyUi } from '@ephox/mcagar';
import { Attr, Body, Element } from '@ephox/sugar';
import EmoticonsPlugin from 'tinymce/plugins/emoticons/Plugin';

UnitTest.asynctest('browser.tinymce.plugins.emoticons.SearchTest', (success, failure) => {
  EmoticonsPlugin();

  // TODO: Move into shared library
  const cFakeEvent = function (name) {
    return Chain.control(
      Chain.op(function (elm: Element) {
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent(name, true, true);
        elm.dom().dispatchEvent(evt);
      }),
      Guard.addLogging('Fake event')
    );
  };

  TinyLoader.setup(function (editor, onSuccess, onFailure) {
    const tinyApis = TinyApis(editor);
    const tinyUi = TinyUi(editor);
    const doc = Element.fromDom(document);

    Pipeline.async({},
      Log.steps('TBA', 'Emoticons: Open dialog, Search for "rainbow", Rainbow should be first option', [
        tinyApis.sFocus,
        tinyUi.sClickOnToolbar('click emoticons', 'button'),
        Chain.asStep({}, [
          tinyUi.cWaitForPopup('wait for popup', 'div[role="dialog"]'),
        ]),
        FocusTools.sTryOnSelector('Focus should start on input', doc, 'input'),
        FocusTools.sSetActiveValue(doc, 'rainbow'),
        Chain.asStep(doc, [
          FocusTools.cGetFocused,
          cFakeEvent('input')
        ]),
        Waiter.sTryUntil(
          'Wait until Euro is the first choice (search should filter)',
          Chain.asStep(Body.body(), [
            UiFinder.cFindIn('.tox-collection__item:first'),
            Chain.mapper((item) => {
              return Attr.get(item, 'data-collection-item-value');
            }),
            Assertions.cAssertEq('Search should show rainbow', '🌈')
          ]),
          100,
          1000
        ),
        Keyboard.sKeydown(doc, Keys.tab(), { }),
        FocusTools.sTryOnSelector('Focus should have moved to collection', doc, '.tox-collection__item'),
        Keyboard.sKeydown(doc, Keys.enter(), { }),
        Waiter.sTryUntil(
          'Waiting for content update',
          tinyApis.sAssertContent('<p>🌈</p>'),
          100,
          1000
        )
      ])
    , onSuccess, onFailure);
  }, {
    plugins: 'emoticons',
    toolbar: 'emoticons',
    theme: 'silver',
    base_url: '/project/js/tinymce',
    emoticons_database_url: '/project/src/plugins/emoticons/main/js/emojis.js'
  }, success, failure);
});
