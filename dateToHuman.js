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
  function isString(o) {
    return typeof o === 'string';
  }

  function getOr(obj, key, defaultValue) {
    if (obj.hasOwnProperty(key)) {
      return obj[key];
    }
    return defaultValue;
  }

  var DAY_VALUE_FORMAT_KEY = '%d';
  var DAY_WORD_FORMAT_KEY = '%D';
  var HOUR_VALUE_FORMAT_KEY = '%h';
  var HOUR_WORD_FORMAT_KEY = '%H';
  var MINUTE_VALUE_FORMAT_KEY = '%m';
  var MINUTE_WORD_FORMAT_KEY = '%M';
  var SECOND_VALUE_FORMAT_KEY = '%s';
  var SECOND_WORD_FORMAT_KEY = '%S';
  var AGO_WORD_FORMAT_KEY = '%(ago)';
  var SINCE_WORD_FORMAT_KEY = '%(since)';

  var OP_REGEX = /([=><!]+)([0-9]+)/;
  var RULE_DYNAMIC_REGEX = /%\((.+)\)/;

  function concat(num, key, getter) {
    if (key == 'ago' || key == 'since') {
      return getter(key);
    }
    return num + ' ' + getter(key, num > 1);
  }

  function parseRule(rule, trans, transKey) {
    if (rule.charAt(0) == '%') {
      var matches = RULE_DYNAMIC_REGEX.exec(rule);
      if (matches != null && matches.length == 2) {
        rule = matches[1];
        var dotIdx = rule.indexOf('.');

        if (dotIdx == 0) {
          return trans[transKey][rule.substring(1)];
        } else if (dotIdx > 0) {
          var fields = rule.split('.');
          var word = trans[fields[0]];
          for (var x = 1; x < fields.length; x++) {
            word = word[fields[x]];
          }
          return word;
        }
      }
    } else {
      return rule;
    }
  }

  function parseRules(transKey, num, trans, ruleGetter, getter) {
    var rules = ruleGetter(transKey)
    var fallback = getter(transKey, num > 1);
    if (rules == null) {
      return fallback;
    }

    var keys = Object.keys(rules);
    for (var i in keys) {
      var key = keys[i];
      var matches = OP_REGEX.exec(key);
      if (matches != null && matches.length == 3) {
        var op = matches[1];
        var val = parseInt(matches[2]);
        if (val != NaN) {
          var rule = rules[key];
          switch (op) {
            case '=':
              if (num == val) {
                return parseRule(rule, trans, transKey);
              }
              break;
            case '>':
              if (num > val) {
                return parseRule(rule, trans, transKey);
              }
              break;
            case '<':
              if (num < val) {
                return parseRule(rule, trans, transKey);
              }
              break;
            case '>=':
              if (num >= val) {
                return parseRule(rule, trans, transKey);
              }
              break;
            case '<=':
              if (num <= val) {
                return parseRule(rule, trans, transKey);
              }
              break;
            case '!=':
              if (num != val) {
                return parseRule(rule, trans, transKey);
              }
              break;
          }
        }
        else {
          return fallback;
        }
      }
      else {
        return fallback;
      }
    }

    return fallback;
  }

  function shouldOmit(num, omit) {
    var matches = OP_REGEX.exec(omit);
    if (matches != null && matches.length == 3) {
      var op = matches[1];
      var val = parseInt(matches[2]);
      if (val != NaN) {
        switch (op) {
          case '=':
            if (num == val) {
              return true;
            }
            break;
          case '>':
            if (num > val) {
              return true;
            }
            break;
          case '<':
            if (num < val) {
              return true;
            }
            break;
          case '>=':
            if (num >= val) {
              return true;
            }
            break;
          case '<=':
            if (num <= val) {
              return true;
            }
            break;
          case '!=':
            if (num != val) {
              return true;
            }
            break;
        }
      }
      return false;
    }
    return false;
  }

  function format(formatter, days, hrs, mins, secs, getter, ruleGetter, trans, omitGetter, sep) {
    if (typeof formatter == 'string') {
      var dayRules = ruleGetter('day');
      var hourRules = ruleGetter('hour');
      var minuteRules = ruleGetter('minute');
      var secondRules = ruleGetter('second');

      var omit = omitGetter('day');
      var dayOmmitted = hrOmmitted = minOmmitted = secOmmitted = false;
      if (!!omit && shouldOmit(days, omit)) {
        formatter = formatter.replace(DAY_VALUE_FORMAT_KEY, '')
        dayOmmitted = true;
      }
      omit = omitGetter('hour');
      if (!!omit && shouldOmit(hrs, omit)) {
        formatter = formatter.replace(HOUR_VALUE_FORMAT_KEY, '')
        hrOmmitted = true;
      }
      omit = omitGetter('minute');
      if (!!omit && shouldOmit(mins, omit)) {
        formatter = formatter.replace(MINUTE_VALUE_FORMAT_KEY, '')
        minOmmitted = true;
      }
      omit = omitGetter('second');
      if (!!omit && shouldOmit(secs, omit)) {
        formatter = formatter.replace(SECOND_VALUE_FORMAT_KEY, '')
        secOmmitted = true;
      }

      formatter = formatter.replace(DAY_VALUE_FORMAT_KEY, (days > 0)?days:'').replace(DAY_WORD_FORMAT_KEY, (days > 0)?parseRules('day', days, trans, ruleGetter, getter):'');
      formatter = formatter.replace(HOUR_VALUE_FORMAT_KEY, (hrs > 0)?((days > 0)?sep:'')+hrs:'').replace(HOUR_WORD_FORMAT_KEY, (hrs > 0)?((days > 0 && hrOmmitted)?sep:'')+parseRules('hour', hrs, trans, ruleGetter, getter):'');
      formatter = formatter.replace(MINUTE_VALUE_FORMAT_KEY, (mins > 0)?((hrs > 0)?sep:'')+mins:'').replace(MINUTE_WORD_FORMAT_KEY, (mins > 0)?((hrs > 0 && minOmmitted)?sep:'')+parseRules('minute', mins, trans, ruleGetter, getter):'');
      formatter = formatter.replace(SECOND_VALUE_FORMAT_KEY, (secs > 0)?((mins > 0)?sep:'')+secs:'').replace(SECOND_WORD_FORMAT_KEY, (secs > 0)?((mins > 0 && secOmmitted)?sep:'')+parseRules('second', secs, trans, ruleGetter, getter):'');
      formatter = formatter.replace(AGO_WORD_FORMAT_KEY, getter('ago')).replace(SINCE_WORD_FORMAT_KEY, getter('since'));
      return formatter.trim().replace(/\s+/g, ' ');
    } else if (typeof formatter == 'function') {
      return formatter(days, hrs, mins, secs, getter)
    }
    return '';
  }

  var locales = {};

  var defaultLocale = 'en';

  var dth = {};

  dth._locale = defaultLocale;
  dth._format = '%d %D %h %H %m %M %s %S %(ago)';

  dth._getLocaleString = function(key, isPlural, locale){
    if (locale == void 0) {
      locale = dth._locale;
    }
    if (isPlural == void 0) {
      isPlural = false;
    }

    var l = locales[locale];
    if (l == undefined) {
      return '';
    }
    l = l.translations[key];
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

  dth._getLocaleRules = function(key, locale){
    if (locale == void 0) {
      locale = dth._locale;
    }

    var l = locales[locale];
    if (l == undefined) {
      return '';
    }
    l = l.translations[key];
    if (l == undefined) {
      return '';
    }
    if (!l.hasOwnProperty('rules')) {
      return null;
    } else {
      return l.rules;
    }
  };

  dth._getLocaleOmit = function(key, locale){
    if (locale == void 0) {
      locale = dth._locale;
    }

    var l = locales[locale];
    if (l == undefined) {
      return '';
    }
    l = l.translations[key];
    if (l == undefined) {
      return '';
    }
    if (!l.hasOwnProperty('omitValue')) {
      return null;
    } else {
      return l.omitValue;
    }
    return null;
  };

  dth._concat = function(num, key) {
    var concatFn;
    var localeObj = locales[dth._locale];
    if (localeObj != undefined && localeObj.hasOwnProperty('concat')) {
      concatFn = localeObj['concat'];
    }

    if (typeof concatFn != 'function') {
      concatFn = concat;
    }

    return concatFn(num, key, dth._getLocaleString);
  };

  dth.setup = function(opts){}; // not implemented yet

  dth.applyTo = function(selector){}; // not implemented yet

  dth.parse = function(val){
    if (isSeconds(val)) {
      val *= 1000;
    }
    if (isString(val) || isMilliseconds(val)) {
      var d = new Date(val);
      if (d == 'Invalid Date') {
        val = null;
      } else {
        val = d;
      }
    } else if (!isDateObject(val)) {
      val = null;
    }

    if (val == null) {
      console.error('passed value is not supported:', val);
      return;
    }

    var nowSecs = Math.floor(DATE.now() / 1000);
    var diff = nowSecs - Math.floor(val.getTime() / 1000);

    if (diff < 0) {
      return;
    }

    var mins = Math.floor(diff / 60);
    var secs = diff % 60;
    var hrs = Math.floor(mins / 60);
    mins = mins % 60;
    var days = Math.floor(hrs / 24);
    hrs = hrs % 24;

    var loc = locales[dth._locale];
    var sep = (!!loc.separator) ? loc.separator : '';

    if (diff >= 0 && diff < 60) {
      return dth._getLocaleString('now');
    } else {
      if (loc.hasOwnProperty('returnDateIfMoreThanDays') && loc.returnDateIfMoreThanDays.hasOwnProperty('days') && days > loc.returnDateIfMoreThanDays.days) {
        var v = loc.returnDateIfMoreThanDays;
        if (loc.returnDateIfMoreThanDays.hasOwnProperty('formatter') && typeof loc.returnDateIfMoreThanDays.formatter == 'function') {
          return loc.returnDateIfMoreThanDays.formatter(val, days);
        } else {
          return val.toDateString();
        }
      }

      if (loc.hasOwnProperty('useYesterday') && loc.useYesterday === true && days == 1) {
        return dth._getLocaleString('yesterday');
      }

      if (loc.hasOwnProperty('format')) {
        return format(loc.format, days, hrs, mins, secs, dth._getLocaleString, dth._getLocaleRules, loc.translations, dth._getLocaleOmit, sep);
      } else {
        var sentence = [];

        if (days > 0) {
          sentence.push(dth._concat(days, 'day'));
        }
        if (hrs > 0) {
          sentence.push(sep+dth._concat(hrs, 'hour'));
        }
        if (mins > 0) {
          sentence.push(sep+dth._concat(mins, 'minute'));
        }
        if (secs > 0) {
          sentence.push(sep+dth._concat(secs, 'second'));
        }

        var regex = new RegExp('^'+sep+'+', 'g');
        sentence = sentence.join(' ').replace(regex, '');

        if (sentence.length > 0) {
          sentence += ' ' + dth._concat(null, 'ago');
        }

        return sentence;
      }
    }
  };

  dth.addLocale = function(opts){
    if (opts.hasOwnProperty('key')) {
      if (opts.hasOwnProperty('translations')) {
        locales[opts.key] = opts;
      }
    }
  };

  dth.setLocale = function(locale) {
    dth._locale = locale;
  };
  dth.getLocale = function() {
    return dth._locale;
  };

  WINDOW.DTH = dth;
})(window, Date);

DTH.addLocale({
  key: 'en',
  translations: {
    'now': {
      'default': 'Now'
    },
    'since': {
      'default': 'Since'
    },
    'ago': {
      'default': 'Ago'
    },
    'yesterday': {
      'default': 'Yesterday'
    },
    'day': {
      'default': 'Day',
      'plural': 'Days'
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
  },
  format: '%d %D %h %H %m %M %s %S %(ago)'
});

DTH.addLocale({
  key: 'ar',
  translations: {
    'yesterday': 'أمس',
    'now': {
      'default': 'الآن'
    },
    'since': {
      'default': 'منذ'
    },
    'second': {
      'default': 'ثانية',
      'plural': 'ثواني',
      'omitValue': '=2',
      'rules': {
        '=1': '%(.default)',
        '=2': 'ثانيتان',
        '<=10': '%(.plural)',
        '>10': '%(.default)',
      },
    },
    'minute': {
      'default': 'دقيقة',
      'plural': 'دقائق',
      'omitValue': '<3',
      'rules': {
        '=1': '%(.default)',
        '=2': 'دقيقتان',
        '<=10': '%(.plural)',
        '>10': '%(.default)',
      }
    },
    'hour': {
      'default': 'ساعة',
      'plural': 'ساعات',
      'omitValue': '<3',
      'rules': {
        '=1': '%(.default)',
        '=2': 'ساعتان',
        '<=10': '%(.plural)',
        '>10': '%(.default)',
      }
    },
    'day': {
      'default': 'يوم',
      'plural': 'أيام',
      'omitValue': '<3',
      'rules': {
        '=1': '%(.default)',
        '=2': 'يومان',
        '<=10': '%(.plural)',
        '>10': '%(.default)',
      }
    }
  },
  format: '%(since) %d %D %h %H %m %M',
  separator: 'و',
  useYesterday: true,
  returnDateIfMoreThanDays: {
    days: 2,
    formatter: function(date, days) {
      return date.toLocaleDateString('ar-eg')
    }
  }
});
