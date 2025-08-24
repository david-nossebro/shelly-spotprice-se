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
{
  /**
   * Flag indicating if config is already read
   * If not, inputs are updated
   */
  let configRead = false;

  /**
   * Helper to convert value to number
   */
  const n = v => Number(v);

  /**
   * Helper to show/hide custom period inputs
   *
   * @param {*} value
   */
  const checkCustomPeriodDisplay = value => {
    doc
      .querySelectorAll('.m2-c')
      .forEach(e => (e.style.display = n(value) < 0 ? 'table-row' : 'none'));
    doc
      .querySelectorAll('.m2-c2')
      .forEach(e => (e.style.display = n(value) < -1 ? 'table-row' : 'none'));
  };

  /**
   * Helper to update currency unit based on country
   * @param {string} _countryCode
   */
  const updateCurrency = _countryCode => {
    const currency = 'SEK/kWh';
    doc
      .querySelectorAll('.price-unit')
      .forEach(e => (e.textContent = currency));
  };

  /**
   * Helper to set radio button value
   *
   * @param {*} name
   * @param {*} value
   */
  const setRadio = (name, value) => {
    doc
      .querySelectorAll(`[name=${name}]`)
      .forEach(e => (e.checked = e.value === value));
  };

  /**
   * Helper to create a radio button row
   * @param {*} name
   * @param {*} value
   * @returns
   */
  const radioRow = (name, value) =>
    `<td><input type="radio" name="${name}" value="${value}"></td>`;

  /**
   * Helper to limit value between min...max
   *
   * @param {*} min
   * @param {*} value
   * @param {*} max
   * @returns
   */
  const limit = (min, value, max) => Math.min(max, Math.max(min, value));

  /**
   * Helper that converts the value to number unless is "avg"
   * @param {*} e
   * @returns
   */
  const avgn = e => (qs(e).value === 'avg' ? 'avg' : n(qs(e).value));

  /**
   * Callback called by main loop
   *
   * @param {*} instChanged true = instance has changed (reset data)
   * @returns
   */
  const onUpdate = async instChanged => {
    try {
      if (instChanged || !state) {
        configRead = false;
        qs('cfg-l').innerHTML = 'Loading...';
        qs('cfg').style.display = 'none';
        return;
      }

      if (configRead) {
        return;
      }

      /** common config */
      const c = state.c;
      /** instance config */
      const ci = state.ci;

      qs('cfg-l').innerHTML = '';
      qs('cfg').style.display = 'block';

      qs('g').value = c.g;
      updateCurrency(c.g);
      qs('vat').value = c.vat;
      qs('day').value = c.day;
      qs('night').value = c.night;

      qs('ci').innerHTML = inst + 1;

      qs('en').checked = ci.en ? 'checked' : '';
      qs('n').value = c.names[inst];
      qs('mode').innerHTML = CNST_MODE_STR.map(
        (m, i) => `<option value="${i}">${m}</option>`
      );
      qs('mode').value = ci.mode;
      qs('outs').value = ci.o.join(',');
      qs('inv').checked = ci.i ? 'checked' : '';

      //building backup hours
      let bk = '';
      for (let i = 0; i < 24; i++) {
        bk += `<label><input type="checkbox" id="b${i}">${('' + i).padStart(2, '0')}</label> `;
      }
      qs('bk').innerHTML = bk;

      //building forced hours
      let fh = `<tr><td>Hour</td><td>OFF</td><td>-</td><td>ON</td></tr>`;
      for (let i = 0; i < 24; i++) {
        fh += `<tr><td>${('' + i).padStart(2, '0')}</td>${radioRow(`f${i}`, 0)}${radioRow(`f${i}`, -1)}${radioRow(`f${i}`, 1)}</tr>`;
      }
      qs('fh').innerHTML = fh;

      //set values of backup and forced hours
      for (let i = 0; i < 24; i++) {
        qs(`b${i}`).checked = (ci.b & (1 << i)) === 1 << i;
        setRadio(
          `f${i}`,
          (ci.f & (1 << i)) === 1 << i
            ? (ci.fc & (1 << i)) === 1 << i
              ? 1
              : 0
            : -1
        );
      }

      qs('min').value = ci.m;
      qs('oc').value = ci.oc;
      qs('err').checked = ci.e ? 'checked' : '';
      qs('m0-cmd').checked = ci.m0.c ? 'checked' : '';
      qs('m1-lim').value = ci.m1.l;
      qs('m2-per').value = ci.m2.p;
      qs('m2-cnt').value = ci.m2.c;
      qs('m2-sq').checked = ci.m2.s ? 'checked' : '';
      qs('m2-m').value = ci.m2.m;
      qs('m2-lim').value = ci.m2.l;
      qs('m2-ps').value = `${ci.m2.ps}`.padStart(2, '0');
      qs('m2-pe').value = `${ci.m2.pe}`.padStart(2, '0');
      qs('m2-ps2').value = `${ci.m2.ps2}`.padStart(2, '0');
      qs('m2-pe2').value = `${ci.m2.pe2}`.padStart(2, '0');
      qs('m2-cnt2').value = ci.m2.c2;
      checkCustomPeriodDisplay(ci.m2.p);

      configRead = true;
    } catch (err) {
      console.error(err);
      qs('cfg-l').innerHTML = err;
    }
  };

  /**
   * Save settings butto click
   */
  const save = async () => {
    try {
      /** common config */
      const c = state.c;
      /** instance config */
      const ci = state.ci;

      c.g = qs('g').value;
      c.vat = n(qs('vat').value);
      c.day = n(qs('day').value);
      c.night = n(qs('night').value);

      ci.en = qs('en').checked ? 1 : 0;
      c.names[inst] = qs('n').value;
      ci.mode = n(qs('mode').value);
      ci.o = qs('outs')
        .value.split(',')
        .map(v => n(v));
      ci.i = qs('inv').checked ? 1 : 0;

      ci.b = 0;
      ci.f = 0;
      ci.fc = 0;
      for (let i = 0; i < 24; i++) {
        if (qs(`b${i}`).checked) {
          ci.b = ci.b | (1 << i);
        }

        const val = doc.querySelector(`[name=f${i}]:checked`).value;

        if (val !== -1) {
          ci.f = ci.f | (1 << i);
          ci.fc = ci.fc | (val << i);
        }
      }
      ci.e = qs('err').checked ? 1 : 0;
      ci.m = n(qs('min').value);
      ci.m = limit(0, ci.m, 60);
      ci.oc = n(qs('oc').value);

      ci.m0.c = qs('m0-cmd').checked ? 1 : 0;
      ci.m1.l = avgn('m1-lim');
      ci.m2.p = n(qs('m2-per').value);
      ci.m2.c = n(qs('m2-cnt').value);
      ci.m2.s = qs('m2-sq').checked ? 1 : 0;
      ci.m2.m = avgn('m2-m');
      ci.m2.l = avgn('m2-lim');
      ci.m2.ps = limit(0, n(qs('m2-ps').value), 23);
      ci.m2.pe = limit(ci.m2.ps, n(qs('m2-pe').value), 24);
      ci.m2.ps2 = limit(0, n(qs('m2-ps2').value), 23);
      ci.m2.pe2 = limit(ci.m2.ps2, n(qs('m2-pe2').value), 24);
      ci.m2.c2 = n(qs('m2-cnt2').value);

      //Checking count limits
      ci.m2.c = limit(0, ci.m2.c, ci.m2.p > 0 ? ci.m2.p : ci.m2.pe - ci.m2.ps);
      ci.m2.c2 = limit(0, ci.m2.c2, ci.m2.pe2 - ci.m2.ps2);

      DBG(me(), 'Settings to save:', c, ci);

      //Saving settings (both common and instance)
      const res = await getData(
        `${URL}/rpc/KVS.Set?key="sptprc-se-${inst + 1}"&value="${encodeURIComponent(JSON.stringify(ci))}"`
      );
      const res2 = await getData(
        `${URL}/rpc/KVS.Set?key="sptprc-se"&value="${encodeURIComponent(JSON.stringify(c))}"`
      );

      if (res.code !== 200 || res2.code !== 200) {
        throw new Error(res.txt + ' | ' + res2.txt);
      }

      await getData(`${CNST_URLS}?r=r&i=${inst}`);

      alert(`Saved!`);
      configRead = false;
    } catch (err) {
      console.error(err);
      alert('Error: ' + err);
    }
  };

  /**
   * Manual force button click
   */
  const force = async () => {
    let hours = prompt(
      `Manual override (#${inst + 1}) - how many hours? (0 = cancel active override)`
    );

    if (hours !== null) {
      hours = Number(hours);

      const cmd =
        hours > 0
          ? parseInt(prompt('Override output ON (1) or OFF (0)?', '1'))
          : 0;

      if (isNaN(cmd)) {
        return;
      }

      const res = await getData(
        `${CNST_URLS}?r=f&i=${inst}&ts=${hours > 0 ? Math.floor(Date.now() / 1000 + hours * 60 * 60) : 0}&c=${cmd}`
      );
      alert(res.code === 204 ? 'OK!' : `Error: ${res.txt}`);
    }
  };

  onUpdate();
  CBS.push(onUpdate);

  qs('save').addEventListener('click', save);
  qs('force').addEventListener('click', force);
  qs('m2-per').addEventListener('change', e =>
    checkCustomPeriodDisplay(e.target.value)
  );
  qs('g').addEventListener('change', e => updateCurrency(e.target.value));
}
