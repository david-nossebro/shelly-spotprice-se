//__REPLACED_WITH_MAIN_CODE__

/**
 * This user script uses the Open-Meteo service's weather forecast to select the number of cheapest hours
 * The colder the temperature, the more cheaper hours are controlled and at the same time the number of control minutes is increased.
 *
 * Edit your location coordinates below - Tampere as an example
 * You can find the coordinates e.g. at https://www.openstreetmap.org/ - right-click and select "show address"
 *
 * After that, edit the logic below to your liking
 */
const LATITUDE = '59.5342';
const LONGITUDE = '13.6246';

// What control is fine-tuned (0 = control #1, 1 = control #2 etc.)
const INSTANCE = 0;

/**
 * Original settings
 */
const originalConfig = {
  hours: 0,
  minutes: 60,
};

/**
 * The day for which the temperatures have been fetched
 */
let activeDay = -1;

/**
 * The lowest and highest temperature of the day
 */
const tempData = {
  min: null,
  max: null,
};

/**
 * Use USER_CONFIG to save the original settings
 */
function USER_CONFIG(inst, initialized) {
  // If it is someone else's settings, do nothing
  if (inst !== INSTANCE) {
    return;
  }

  // A few helper variables
  const state = _;
  const config = state.c.i[inst];

  // If settings are not yet available, skip (new installation)
  if (typeof config.m2 === 'undefined') {
    console.log('Save the settings once for the user script');
    return;
  }

  // Save original settings to memory
  if (initialized) {
    // Executing temperature logic
    activeDay = -1;

    originalConfig.hours = config.m2.c;
    originalConfig.minutes = config.m;

    console.log('Original settings:', originalConfig);
  }
}

/**
 * Once the logic has been executed, see if the effect of the temperature has already been checked for this day
 * If not, fetch temperatures and change the number of hours
 */
function USER_OVERRIDE(inst, cmd, callback) {
  // If it is someone else's settings, do nothing
  if (inst !== INSTANCE) {
    callback(cmd);
    return;
  }

  // A few helper variables
  const state = _;
  const config = state.c.i[inst];

  // By default, use the number of hours and control minutes stored in the original settings
  // Therefore, if you save the settings from the user interface, they will also be used here
  let hours = originalConfig.hours;
  let minutes = originalConfig.minutes;

  try {
    if (activeDay === new Date().getDate()) {
      console.log(
        'Temperatures already fetched for today -> no changes:',
        tempData
      );
      callback(cmd);
      return;
    }

    // Documentation on API can be found here: https://open-meteo.com/en/docs
    // Interesting parameters for different data might be:
    // daily=temperature_2m_max
    // daily=temperature_2m_min
    // daily=temperature_2m_mean
    // daily=apparent_temperature_mean
    let req = {
      url:
        'https://api.open-meteo.com/v1/forecast?latitude=' +
        LATITUDE +
        '&longitude=' +
        LONGITUDE +
        '&daily=apparent_temperature_mean&timezone=auto&forecast_days=1',
      timeout: 5,
      ssl_ca: '*',
    };

    console.log('Fetching temperature data:', req.url);

    Shelly.call('HTTP.GET', req, function (res, err, msg) {
      try {
        req = null;

        if (err === 0 && res !== null && res.code === 200 && res.body) {
          const data = JSON.parse(res.body);
          res.body = null;

          // Check if the response is valid
          if (data.daily.apparent_temperature_mean !== undefined) {
            // Now we have the lowest and highest temperature for today
            //tempData.min = data.daily.temperature_2m_min[0];
            //tempData.max = data.daily.temperature_2m_max[0];
            tempData.avg = data.daily.apparent_temperature_mean[0];

            console.log('Temperatures:', tempData);

            //------------------------------
            // Functionality
            // edit as you wish
            //------------------------------

            // Set the temperature based on the apparant_avg temperature
            if (tempData.avg > 10) {
              hours = 1;
              minutes = 60;
            } else if (tempData.avg <= -50) {
              hours = 24;
              minutes = 60;
            } else if (tempData.avg <= -45) {
              hours = 22;
              minutes = 60;
            } else if (tempData.avg <= -40) {
              hours = 20;
              minutes = 60;
            } else if (tempData.avg <= -35) {
              hours = 18;
              minutes = 60;
            } else if (tempData.avg <= -30) {
              hours = 16;
              minutes = 60;
            } else if (tempData.avg <= -25) {
              hours = 14;
              minutes = 60;
            } else if (tempData.avg <= -20) {
              hours = 12;
              minutes = 60;
            } else if (tempData.avg <= -15) {
              hours = 10;
              minutes = 60;
            } else if (tempData.avg <= -10) {
              hours = 8;
              minutes = 60;
            } else if (tempData.avg <= -5) {
              hours = 6;
              minutes = 60;
            } else if (tempData.avg <= 0) {
              hours = 4;
              minutes = 60;
            } else if (tempData.avg <= 5) {
              hours = 2;
              minutes = 60;
            }

            //------------------------------
            // Functionality ends
            //------------------------------
            state.si[inst].str =
              'Average apparent temperature today: ' +
              tempData.avg.toFixed(1) +
              '°C -> cheap hours: ' +
              hours +
              ' h, control: ' +
              minutes +
              ' min';
            console.log(
              'Average apparent temperature today:',
              tempData.avg.toFixed(1),
              '°C -> set number of cheapest hours to ',
              hours,
              'h and control minutes to',
              minutes,
              'min'
            );

            // No need to fetch again today
            activeDay = new Date().getDate();
          } else {
            throw new Error('Invalid temperature data');
          }
        } else {
          throw new Error('Failed to fetch temperatures:' + msg);
        }
      } catch (err) {
        state.si[inst].str = 'Error in temperature control:' + err;
        console.log('Error processing temperatures:', err);
      }

      // Set values to settings
      //NOTE: If you use "custom selection (2 periods)", you can set the hours for the 2nd period in the variable "state.c.m2.cnt2"
      config.m2.c = hours;
      config.m = minutes;

      // Request to run the logic again
      callback(null);
      return;
    });
  } catch (err) {
    state.si[inst].str = 'Error in temperature control:' + err;
    console.log('An error occurred in the USER_OVERRIDE function. Error:', err);

    config.m2.c = hours;
    config.m = minutes;

    callback(cmd);
  }
}
