(function(WINDOW, DATE){
  function isDateObject(o) {
    return typeof o === 'object' && o.__proto__.hasOwnProperty('getDate') && o.__proto__.hasOwnProperty('getTime');
  }
  function isMilliseconds(o) {
    if (typeof o === 'number') {
      var s = ''+o;
      if (s.indexOf('.') > -1) {
        o = Math.floor(o);
      }
      s = ''+o;
      return s.length === 13;
    }
    return false;
  }
  function isSeconds(o) {
    if (typeof o === 'number') {
      var s = ''+o;
      if (s.indexOf('.') > -1) {
        o = Math.floor(o);
      }
      s = ''+o;
      return s.length === 10;
    }
    return false;
  }

  function concat(num, key, getter) {
    return num + ' ' + getter(key, num > 1);
  }

  var locales = {
    'en': {
      'now': {
        'default': 'Now'
      },
      'since': {
        'default': 'Since'
      },
      'ago': {
        'default': 'Ago'
      },
      'hour': {
        'default': 'Hour',
        'plural': 'Hours'
      },
      'minute': {
        'default': 'Minute',
        'plural': 'Minutes'
      },
      'second': {
        'default': 'Second',
        'plural': 'Seconds'
      }
    }
  };

  var defaultLocale = 'en';

  var dth = {};

  dth._locale = defaultLocale;

  dth._getLocaleString = function(key, isPlural, locale){
    if (locale == void 0) {
      locale = dth._locale;
    }

    var l = locales[locale];
    if (l == undefined) {
      return '';
    }
    l = l[key];
    if (l == undefined) {
      return '';
    }
    if (!l.hasOwnProperty('default')) {
      return l;
    } else {
      if (!isPlural) {
        return l['default'];
      } else if (l.hasOwnProperty('plural')) {
        return l['plural'];
      } else {
        return l;
      }
    }
    return l;
  };

  dth._concat = function(num, key) {
    var concatFn;
    var localeObj = locales[dth._locale];
    if (localeObj != undefined && localeObj.hasOwnProperty('_concat')) {
      concatFn = localeObj['_concat'];
    }

    if (typeof concatFn != 'function') {
      concatFn = concat;
    }

    return concatFn(num, key, dth._getLocaleString);
  };

  dth.setup = function(opts){}; // not implemented yet

  dth.applyTo = function(selector){}; // not implemented yet

  dth.parse = function(val){
    if (isDateObject(val)) {
      val = Math.floor(val.getTime() / 1000);
    } else if (isMilliseconds(val)) {
      val = Math.floor(val / 1000);
    } else if (!isSeconds(val)) {
      // TODO: add support for strings
      console.error('passed value is not supported:', val);
      return;
    }

    var nowSecs = Math.floor(DATE.now() / 1000) + 1278;
    var diff = nowSecs - val;

    if (diff >= 0 && diff < 60) {
      return dth._getLocaleString('now');
    } else if (diff < 0) {
      return;
    } else {
      var mins = Math.floor(diff / 60);
      var secs = diff % 60;
      var hrs = Math.floor(mins / 60);
      mins = mins % 60;

      var sentence = [];

      if (hrs > 0) {
        sentence.push(dth._concat(hrs, 'hour'));
      }
      if (mins > 0) {
        sentence.push(dth._concat(mins, 'minute'));
      }
      if (secs > 0) {
        sentence.push(dth._concat(secs, 'second'));
      }

      if (sentence.length > 0) {
        sentence.push(dth._getLocaleString('ago'))
      }

      return sentence.join(' ');
    }
  };

  dth.setLocale = function(opts){
    var obj = {};
    if (opts.hasOwnProperty('key')) {
      if (opts.hasOwnProperty('default')) {
        obj['default'] = opts.default;
      }
      if (opts.hasOwnProperty('plural')) {
        obj['plural'] = opts.plural;
      }
      if (opts.hasOwnProperty('concat')) {
        obj['_concat'] = opts.concat;
      }
      locales[opts.key] = obj;
    }
  };

  WINDOW.DTH = dth;
})(window, Date);

DTH.setLocale({
  key: 'ar',
  translations: {
    'now': {
      'default': 'الآن'
    },
    'since': {
      'default': 'منذ'
    },
    'second': {
      'default': 'ثانية',
      'plural': 'ثواني'
    },
    'minute': {
      'default': 'دقيقة',
      'plural': 'دقائق'
    },
    'hour': {
      'default': 'ساعة',
      'plural': 'ساعات'
    }
  },
  concat: function(num, key, getter) {
    if (num == 1) // TODO: start from here
  }
})

console.log(DTH.parse(new Date()));
