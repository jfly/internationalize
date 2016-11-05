export default class TranslationsTranslateController {
  constructor(translation, TranslationUtils, TranslationService) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;

    this.statistics = TranslationUtils.statistics(translation.data);
    this.untranslatedKeys = TranslationUtils.untranslatedKeysGenerator(translation.data);
    this.next();
  }

  done() {
    let keyId = this.chain.join('.');
    this.TranslationService.updateKey(this.translation._id, `${keyId}._translated`, this.key._translated)
      .then(() => {
        this.statistics.translatedCount++;
        this.next();
      });
  }

  next() {
    let generated = this.untranslatedKeys.next();
    let { key = null, chain = null } = generated.value || {};
    this.key = key;
    this.chain = chain;
    this.finished = generated.done;
  }
}
