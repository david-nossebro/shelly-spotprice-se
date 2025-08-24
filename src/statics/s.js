/**
 * shelly-spotprice-se
 *
 * https://github.com/david-nossebro/shelly-spotprice-se
 *
 * Special thanks to Jussi isotalo who created the original repo
 * available here:
 * https://github.com/jisotalo/shelly-porssisahko
 * https://github.com/jisotalo/shelly-porssisahko-en
 *
 * License: GNU Affero General Public License v3.0
 */

/**
 * URL of the shelly (only if DEV active, otherwise it is same origin)
 */
const CNST_URL = '';

/**
 * URL of the logic script
 */
const CNST_URLS = ``;

/**
 * Selected instance from dropdown
 */
let inst = 0;

/**
 * Active tab name
 */
let activeTab = '';

/**
 * Shortcut for document
 */
const doc = document;

/**
 * Shortcut for querySelector() call
 */
const qs = s => doc.querySelector('#' + s);

/**
 * debug function that is printing to console only when DEV is active
 */
const DBG = () => {};

/**
 * Enumeration of state
 */
const CNST_STATE_STR = [
  'Starting...', //0
  'Manual mode', //1
  'Price below limit', //2
  'Price over limit', //3
  'Not among cheapest in this period', //4
  'Cheapest among this period', //5
  'Price below always on limit', //6
  'Backup control (no prices, time known)', //7
  'Emergency control (time unknown)', //8
  'Manual override (until %s)', //9
  'Override hour', //10
  'Price over max. limit', //11
  'User script overwriting', //12
  'Control minutes of this hour already used', //13
];

/**
 * Enumeration of mode
 */
const CNST_MODE_STR = ['Manual', 'Price limit', 'Cheapest hours'];

/**
 * Global state
 *
 * undefined = not yet read
 * null = error
 */
let state = undefined;

/**
 * Callbacks to call when state is updated
 */
const CBS = [];

/**
 * Helper that is used for DBG calls to add caller information
 */
const me = () => '';

/**
 * Timer handle
 */
let loopTimer = null;

/**
 * fetch() aborter for updateLoop()
 */
let aborter = new AbortController();

/**
 * Opens tab with given name
 * @param {*} tab
 * @returns
 */
const openTab = async tab => {
  if (tab === undefined || tab === '') {
    tab = 'tab-status';
  }

  window.location.hash = `${tab}/${inst + 1}`;
  activeTab = tab;

  const e = qs('' + tab);
  if (e) {
    e.checked = true;
  }

  if (qs(`c-${tab}`).innerHTML === '') {
    try {
      await populateDynamicData(`${tab}.html`, `c-${tab}`);
    } catch (err) {
      DBG(me(), 'error', err);
      console.error(err);
      if (confirm(`Failed to load the page - try again? (${err.message})`)) {
        openTab(tab);
      }
    }
  }

  updateLoop(true);
};

/**
 * When page opens, select tab by URL hash
 */
window.onload = async () => {
  const hash = window.location.hash.split('/');
  inst = (parseInt(hash[1]) || 1) - 1;
  openTab(hash[0].slice(1));

  if (DEV) {
    reqJs('dev.js');
  }
};

/**
 * Tab changing
 */
doc.querySelectorAll('.ts').forEach(e =>
  e.addEventListener('change', e => {
    openTab(e.target.id);
  })
);

/**
 * eval() <script> tag contents
 * @param {*} elementId
 */
const evalContainerScriptTags = elementId => {
  DBG(me(), 'eval running for', elementId);

  const scripts = qs(elementId).querySelectorAll('script');
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].innerText) {
      /*DBG(scripts[i].innerText);*/
      eval(scripts[i].innerText);
    } else {
      fetch(scripts[i].src).then(function (data) {
        data.text().then(function (r) {
          eval(r);
        });
      });
    }
    scripts[i].parentNode.removeChild(scripts[i]);
  }
};

/**
 * Loads dynamic data from URL to the container in DOM
 * @param {*} url
 * @param {*} containerId
 */
const populateDynamicData = async (url, containerId) => {
  if (!DEV) {
    url = `${CNST_URLS}?r=${url.replace('tab-', '').replace('.html', '')}`;
  }
  DBG(me(), 'fetching', url, 'for', containerId);

  const res = await getData(url, false);

  if (res.ok) {
    qs(containerId).innerHTML = res.data;
    evalContainerScriptTags(containerId);
  } else {
    throw new Error(res.txt);
  }

  DBG(me(), 'done for', containerId);
};

/**
 * Fetches data as json or plain text
 * @param {*} url
 * @param {*} isJson
 * @returns
 */
const getData = async (url, isJson = true, signal = null) => {
  try {
    const res = await fetch(url, { signal });

    if (res.ok) {
      let data = null;

      if (res.status !== 204) {
        if (isJson) {
          data = await res.json();
        } else {
          data = await res.text();
        }
      }
      DBG(me(), `Fetching ${url} done. Status code: ${res.status}`);

      return {
        ok: true,
        code: res.status,
        txt: res.statusText,
        data,
      };
    } else {
      console.error(`${url}: ${res.statusText}`);

      return {
        ok: false,
        code: res.status,
        txt: `${url}: ${res.statusText} (${await res.text()})`,
        data: null,
      };
    }
  } catch (err) {
    console.error(url, err);

    return {
      ok: false,
      code: -1,
      txt: JSON.stringify(err, Object.getOwnPropertyNames(err)) + ' :' + url,
      data: null,
    };
  }
};

/**
 * Formats Date to string as dd.mm.yyyy
 * @param {*} date
 * @returns
 */
const formatDate = date => {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
};

/**
 * Formats Date to time string as hh:mm[:ss]
 * @param {*} date
 * @param {*} showSeconds true = add seconds
 * @returns
 */
const formatTime = (date, showSeconds = true) => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}${showSeconds ? `:${date.getSeconds().toString().padStart(2, '0')}` : ''}`;
};

/**
 * Formats Date to datetime string
 * @param {*} date
 * @param {*} showSeconds true = add seconds
 * @returns
 */
const formatDateTime = (date, showSeconds = true) => {
  return `${formatDate(date)} ${formatTime(date, showSeconds)}`;
};

/**
 * Called by setTimeout every 5 seconds
 *
 * Can be also called manually when instance has been changed (instChanged)
 *
 * @param {*} instChanged true if instance has been changed
 */
const updateLoop = async () => {
  const instance = inst;
  clearTimeout(loopTimer);
  DBG(me(), 'Updating');
  qs('spin').style.visibility = 'visible';

  try {
    //Clear previous requests
    aborter.abort();

    aborter = new AbortController();
    const res = await getData(`${CNST_URLS}?r=s&i=${inst}`, true, aborter.signal);

    if (inst !== instance) {
      //Instance has been changed, do nothing
      return;
    }

    if (res.ok) {
      state = res.data;

      //Updating title
      doc.title = (state.s.dn ? state.s.dn + ' - ' : '') + 'Spotprice SE';

      //Updating instances to dropdown
      qs('inst').innerHTML = state.c.names.map(
        (n, i) => `<option value="${i}">Control #${i + 1}: ${n}</option>`
      );
      qs('inst').value = inst;

      //If status 503 the shelly is just now busy running the logic -> do nothing
    } else if (res.code !== 503) {
      //A real error
      state = null;
    }

    CBS.forEach(cb => cb());
  } catch (err) {
    console.error(err);
    state = null;
  } finally {
    qs('spin').style.visibility = 'hidden';
    //Prevent multiple timers
    if (inst === instance) {
      clearTimeout(loopTimer);
      loopTimer = setTimeout(updateLoop, 5000);
    }
  }
};

/**
 * Adding event handler to instance dropdown
 */
qs('inst').addEventListener('change', e => {
  //Instance has changed by user
  inst = parseInt(e.target.value);

  //Reset state as it's no longer valid
  state = undefined;

  //Running callbacks so that pages know instance has changed (no new data yet)
  CBS.forEach(cb => cb(true));

  //Run loop immediately
  updateLoop();

  openTab(activeTab);
});
