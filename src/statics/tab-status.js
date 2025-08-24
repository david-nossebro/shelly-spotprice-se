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
   * Table content if data not yet available
   */
  const notYetKnown = `<tr><td colspan="3">Not yet known</td></tr>`;

  /**
   * Clears status page
   * Used when instance is changed or during error
   */
  const clear = () => {
    const c = e => (qs(e).innerHTML = '');
    c('s-cmd');
    qs('s-cmd').style.color = '#000';
    c('s-dn');
    c('s-now');
    c('s-mode');
    c('s-p0');
    c('s-pi0');
    c('s-p1');
    c('s-pi1');
    c('s-info');
    c('s-st');
  };

  /**
   * Callback called by main loop
   *
   * @param {*} instChanged true = instance has changed (reset data)
   * @returns
   */
  const onUpdate = async instChanged => {
    try {
      if (instChanged || state === undefined) {
        clear();
        qs('s-cmd').innerHTML = 'Loading...';
        return;
      }

      if (!state) {
        throw new Error('no data');
      }

      /** data (state) */
      const d = state;
      /** status */
      const s = d.s;
      /** common config */
      const c = d.c;
      /** instance status*/
      const si = d.si;
      /** instance config */
      const ci = d.ci;

      const priceUnit = 'SEK/kWh';

      //If instance is enabled (otherwise just update price lists)
      if (ci.en) {
        qs('s-cmd').innerHTML = si.cmd ? 'ON' : 'OFF';
        qs('s-cmd').style.color = si.cmd ? 'green' : 'red';

        qs('s-mode').innerHTML = CNST_MODE_STR[ci.mode];

        qs('s-now').innerHTML =
          d.p.length > 0 ? `${s.p[0].now.toFixed(2)} ${priceUnit}` : '';

        qs('s-st').innerHTML =
          si.st === 9
            ? CNST_STATE_STR[si.st].replace(
                '%s',
                formatDateTime(new Date(si.fCmdTs * 1000), false)
              )
            : CNST_STATE_STR[si.st] + (ci.i ? ' (inverted)' : '');

        //Extended status for instance (by user scripts)
        if (si.str !== '') {
          qs('s-st').innerHTML += `<br><br>${si.str}`;
        }

        qs('s-info').innerHTML =
          si.chkTs > 0
            ? `Output checked at ${formatTime(new Date(si.chkTs * 1000))}`
            : `Checking output...`;
      } else {
        //Instance is not enabled, clear almost everything
        clear();
        qs('s-info').innerHTML = `Not enabled`;
        qs('s-cmd').innerHTML = `Control #${inst + 1} isn't enabled`;
        qs('s-cmd').style.color = '000';
      }

      //Device name and instance
      let dn = s.dn ? s.dn : '<i>Not set</i>';
      if (c.names[inst]) {
        dn += ` | ${c.names[inst]}`;
      }
      dn += ` (control #${inst + 1})`;
      qs('s-dn').innerHTML = dn;

      //Price info
      qs('s-info').innerHTML += ` - ${
        s.p[0].ts > 0
          ? `Prices updated at ${formatTime(new Date(Math.max(s.p[0].ts, s.p[1].ts) * 1000))}`
          : 'Getting prices...'
      }`;

      //Version info (footer)
      qs('s-v').innerHTML =
        `Started at ${formatDateTime(new Date(s.upTs * 1000))} (uptime ${((new Date().getTime() - new Date(s.upTs * 1000).getTime()) / 1000.0 / 60.0 / 60.0 / 24.0).toFixed('1')} days) - version ${s.v}`;

      /**
       * Helper that builds price info table for today or tomorrow
       */
      const buildPriceTable = priceInfo => {
        const header = `<tr><td class="t bg">Average</td><td class="t bg">Lowest</td><td class="t bg">Highest</td></tr>`;

        if (priceInfo.ts === 0) {
          return `${header}${notYetKnown}`;
        }

        return `${header}
        <tr>
          <td>${priceInfo.avg.toFixed(2)} ${priceUnit}</td>
          <td>${priceInfo.low.toFixed(2)} ${priceUnit}</td>
          <td>${priceInfo.high.toFixed(2)} ${priceUnit}</td>
        </tr>`;
      };

      //Price info for today and tomorrow
      qs('s-pi0').innerHTML = buildPriceTable(s.p[0]);
      qs('s-pi1').innerHTML = buildPriceTable(s.p[1]);

      /**
       * Helper that builds price/cmd table for today or tomorrow
       */
      const buildPriceList = (dayIndex, element) => {
        const header = ` <tr><td class="t bg">Time</td><td class="t bg">Price</td><td class="t bg">Output</td></tr>`;

        if (s.p[dayIndex].ts === 0) {
          element.innerHTML = `${header}${notYetKnown}`;
          return;
        }

        //------------------------------
        // Cheapest hours logic
        // This needs match 1:1 the Shelly script side
        //------------------------------
        const cheapest = [];
        if (ci.mode === 2) {
          //Select increment (a little hacky - to support custom periods too)
          const inc = ci.m2.p < 0 ? 1 : ci.m2.p;

          for (let i = 0; i < d.p[dayIndex].length; i += inc) {
            const cnt = ci.m2.p === -2 && i >= 1 ? ci.m2.c2 : ci.m2.c;

            //Safety check
            if (cnt <= 0) continue;

            //Create array of indexes in selected period
            const order = [];

            //If custom period -> select hours from that range. Otherwise use this period
            let start = i;
            let end = i + ci.m2.p;

            if (ci.m2.p < 0 && i === 0) {
              //Custom period 1
              start = ci.m2.ps;
              end = ci.m2.pe;
            } else if (ci.m2.p === -2 && i === 1) {
              //Custom period 2
              start = ci.m2.ps2;
              end = ci.m2.pe2;
            }

            for (let j = start; j < end; j++) {
              //If we have less hours than 24 then skip the rest from the end
              if (j > d.p[dayIndex].length - 1) break;

              // Forced hours that overrides cheapest hours should be removed so
              // we still select the right amount of total hours in a period.
              const binNow = 1 << j;
              const isForcedHour = (ci.f & binNow) === binNow;
              if (isForcedHour) {
                const forcedOn = (ci.fc & binNow) === binNow;

                // If hour is overriden to ON -> keep it
                // If hour is overriden to OFF -> do not include among cheapest hours
                // Note: Configuration of forced hours are inverted, if that setting is on.
                if (forcedOn) {
                  order.push(j);
                }
              } else {
                order.push(j);
              }
            }

            if (ci.m2.s) {
              //Find cheapest in a sequence
              //Loop through each possible starting index and compare average prices
              let avg = 999;
              let startIndex = 0;

              for (let j = 0; j <= order.length - cnt; j++) {
                let sum = 0;

                //Calculate sum of these sequential hours
                for (let k = j; k < j + cnt; k++) {
                  sum += d.p[dayIndex][order[k]][1];
                }

                //If average price of these sequential hours is lower -> it's better
                if (sum / cnt < avg) {
                  avg = sum / cnt;
                  startIndex = j;
                }
              }

              for (
                let j = startIndex;
                j < startIndex + cnt && j < order.length;
                j++
              ) {
                cheapest.push(order[j]);
              }
            } else {
              //Sort indexes by price
              let j = 0;

              for (let k = 1; k < order.length; k++) {
                const temp = order[k];

                for (
                  j = k - 1;
                  j >= 0 && d.p[dayIndex][temp][1] < d.p[dayIndex][order[j]][1];
                  j--
                ) {
                  order[j + 1] = order[j];
                }
                order[j + 1] = temp;
              }

              //Select the cheapest ones
              for (let j = 0; j < cnt; j++) {
                cheapest.push(order[j]);
              }
            }

            //If custom period, quit when all periods are done (1 or 2 periods)
            if (ci.m2.p === -1 || (ci.m2.p === -2 && i >= 1)) break;
          }
        }

        //------------------------------
        // Building the price list
        //------------------------------
        element.innerHTML = header;

        let per = 0;
        let bg = false;
        for (let i = 0; i < d.p[dayIndex].length; i++) {
          const row = d.p[dayIndex][i];
          const date = new Date(row[0] * 1000);

          //Forced hour on
          const fon =
            (ci.f & (1 << i)) === 1 << i && (ci.fc & (1 << i)) === 1 << i;
          //Forced hour off
          const foff = (ci.f & (1 << i)) === 1 << i && (ci.fc & (1 << i)) === 0;

          const mode2MaxPrice = ci.m2.m === 'avg' ? s.p[dayIndex].avg : ci.m2.m;

          let cmd =
            ((ci.mode === 0 && ci.m0.cmd) ||
              (ci.mode === 1 &&
                row[1] <= (ci.m1.l === 'avg' ? s.p[dayIndex].avg : ci.m1.l)) ||
              (ci.mode === 2 &&
                cheapest.includes(i) &&
                row[1] <= mode2MaxPrice) ||
              (ci.mode === 2 &&
                row[1] <= (ci.m2.l === 'avg' ? s.p[dayIndex].avg : ci.m2.l) &&
                row[1] <= mode2MaxPrice) ||
              fon) &&
            !foff;

          //Invert
          if (ci.i) {
            cmd = !cmd;
          }

          if (!ci.en) {
            cmd = false;
          }

          if (
            ci.en &&
            ci.mode === 2 &&
            ((ci.m2.p < 0 && (i === ci.m2.ps || i === ci.m2.pe)) ||
              (ci.m2.p === -2 && (i === ci.m2.ps2 || i === ci.m2.pe2)) ||
              (ci.m2.p > 0 && i >= per + ci.m2.p))
          ) {
            //Period changed
            per += ci.m2.p;
            bg = !bg;
          }

          element.innerHTML += `<tr style="${date.getHours() === new Date().getHours() && dayIndex === 0 ? `font-weight:bold;` : ``}${bg ? 'background:#ededed;' : ''}">
            <td class="fit">${formatTime(date, false)}</td>
            <td>${row[1].toFixed(2)} ${priceUnit}</td>
            <td>${cmd ? '&#x2714;' : ''}${fon || foff ? `**` : ''}</td>
          </tr>`;
        }

        return s.p[dayIndex].ts;
      };

      //Creating price/cmd tables for today and tomorrow
      buildPriceList(0, qs('s-p0'));
      buildPriceList(1, qs('s-p1'));
    } catch (err) {
      console.error(err);

      clear();
      qs('s-cmd').innerHTML = `Status unknown (${err.message})`;
      qs('s-cmd').style.color = 'red';
    }
  };

  onUpdate();
  CBS.push(onUpdate);
}
