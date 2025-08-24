# shelly-spotprice-se - Swedish nordpool electricity spot price control for Shelly devices
[![License](https://img.shields.io/badge/License-AGPLv3-orange)](https://choosealicense.com/licenses/agpl-3.0/)
[![GitHub](https://img.shields.io/badge/View%20on-GitHub-brightgreen)](https://github.com/david-nossebro/shelly-spotprice-se)

A free open source script for Shelly devices to control outputs by Nordpool electricity spot price. Script runs its own web server and saves its settings to Shelly's memory. Fully configured and monitored using a web browser.

A fork of [shelly-porssisahko-en](https://github.com/jisotalo/shelly-porssisahko-en) created for the Finnish and Baltic market by [jitsalo](https://github.com/jisotalo). Check it out if that´s where you´re based!

Script uses API by [elprisetjustnu.se](https://www.elprisetjustnu.se/elpris-api) without any other services. No need to register anywhere, it just works.

--- 
TODO - Create new gif

![alt text](img/shelly-porssisahko.gif)

## Features
* Free and open source
* Own web server and a web-based user interface
* No registeration
* Monitoring and configuration with a web browser in local network (PC, phone, tablet)
* Possible to create up to three different controls using their own rules
* Prices and control status for today and tomorrow
* Three different operation modes
* Possibility to control only part of an hour, e.g. first 30 minutes
* Temporary manual override or configurable overrides for specific hours
* Fault-tolerant
  * Backup hours configurable (if no prices available but time is known)
  * Emergency (if no internet connection and no known time)
* Possible to configure and extend by user scripts

## Table of contents
- [shelly-spotprice-se - Swedish nordpool electricity spot price control for Shelly devices](#shelly-spotprice-se---Swedish-nordpool-electricity-spot-price-control-for-shelly-devices)
  - [Features](#features)
  - [Table of contents](#table-of-contents)
  - [Documentation](#documentation)
  - [For Developers](#for-developers)
  - [For AI Tools](#for-ai-tools)
  - [Changelog](#changelog)
  - [Support](#support)
  - [Installation](#installation)
    - [Install using a library (recommended)](#install-using-a-library-recommended)
    - [Install manually](#install-manually)
  - [Updating script](#updating-script)
  - [Shelly devices](#shelly-devices)
  - [Settings](#settings)
    - [Common settings](#common-settings)
    - [Control settings](#control-settings)
      - [General](#general)
      - [Manual mode](#manual-mode)
      - [Price limit](#price-limit)
      - [Chepeast hours](#chepeast-hours)
    - [Chepeast hours - custom periods](#chepeast-hours---custom-periods)
    - [Commands](#commands)
  - [Addditional features by user scripts](#addditional-features-by-user-scripts)
    - [User script features](#user-script-features)
    - [Adjusting settings with a separate script (remotely)](#adjusting-settings-with-a-separate-script-remotely)
  - [FAQ](#faq)
    - [Why the script isn't getting prices?](#why-the-script-isnt-getting-prices)
    - [How reliable is this script?](#how-reliable-is-this-script)
    - [Why I sometimes get HTTP error 503?](#why-i-sometimes-get-http-error-503)
    - [Why the device name says "not set"?](#why-the-device-name-says-not-set)
    - [How to use with Switch Add-On?](#how-to-use-with-switch-add-on)
    - [When the script reads the prices for tomorrow?](#when-the-script-reads-the-prices-for-tomorrow)
    - [Where are the settings saved to?](#where-are-the-settings-saved-to)
    - [Why is the history length so short?](#why-is-the-history-length-so-short)
  - [Technical info](#technical-info)
    - [General](#general-1)
    - [Building the script](#building-the-script)
  - [License](#license)

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and component relationships
- **[API Reference](docs/API_REFERENCE.md)** - Complete function and method documentation
- **[Configuration Schema](docs/CONFIGURATION_SCHEMA.md)** - Detailed configuration options
- **[Data Flow](docs/DATA_FLOW.md)** - How data moves through the system
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup and contribution guidelines
- **[Development Guidelines](docs/DEVELOPMENT_GUIDELINES.md)** - Comprehensive coding standards and best practices
- **[HTTP API](docs/HTTP_API.md)** - Web interface and REST endpoints
- **[Extension System](docs/EXTENSION_SYSTEM.md)** - User script integration
- **[AI Changes](docs/ai-changes/)** - Documentation of AI-assisted improvements and changes

## For Developers

This project includes comprehensive development tools and documentation:

- **TypeScript Definitions**: Complete type definitions in [`types/`](types/) directory
- **Test Suite**: Unit and integration tests in [`tests/`](tests/) directory
- **Development Tools**: ESLint, Prettier, and JSDoc configurations
- **Code Analysis**: JSConfig for enhanced IDE support

Key development resources:
- [Development Setup Guide](docs/DEVELOPMENT.md)
- [Development Guidelines](docs/DEVELOPMENT_GUIDELINES.md)
- [TypeScript Definitions](types/README.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)

## For AI Tools

This codebase has been optimized for AI tool analysis and assistance:

- **Comprehensive Documentation**: All functions, classes, and modules are documented
- **Type Definitions**: Complete TypeScript definitions for all interfaces and types
- **Clear Architecture**: Well-documented system design and data flow
- **Test Coverage**: Extensive test suite with examples and mocks
- **Configuration Schema**: Detailed schema documentation for all settings
- **AI Change History**: Complete documentation of AI-assisted improvements

AI tools can effectively:
- Understand the codebase structure through [Architecture docs](docs/ARCHITECTURE.md)
- Follow development best practices through [Development Guidelines](docs/DEVELOPMENT_GUIDELINES.md)
- Analyze data flow through [Data Flow documentation](docs/DATA_FLOW.md)
- Reference complete APIs through [API Reference](docs/API_REFERENCE.md)
- Use TypeScript definitions for accurate code analysis
- Run tests to verify changes and understand expected behavior
- Review AI improvement history in [AI Changes documentation](docs/ai-changes/)

## Changelog

 See [CHANGELOG.md](https://github.com/david-nossebro/shelly-spotprice-se/blob/master/CHANGELOG.md) for version history.

## Support

This project is a fork of [shelly-porssisahko-en](https://github.com/jisotalo/shelly-porssisahko-en). If you want to buy someone a coffe, head over there. :coffee: :hearts:

If you want to support this projekt, reach out and help with coding, testing or documentation. If you found a bug or have ideas on how to improve, write an [issue](https://github.com/david-nossebro/shelly-spotprice-se/issues)
 
## Installation

### Install using a library (recommended)

1. Install Shelly, connect it to a WiFi and update its firmware. Older versions aren't supported.
2. Open Shelly Web UI **with a web browser**
3. Open **Scripts** page
4. Click **Library** button

    ![alt text](img/install-1.png)

5. Click **Configure URL**.
6. Enter address `https://raw.githubusercontent.com/david-nossebro/shelly-spotprice-se/master/shelly-library.json` and click **Save**.

    ![alt text](img/install-2.png)

7. Now the scripts are available. Install the topmost script (full features) by clicking **Import code**.

    ![alt text](img/install-3.png)

1. When the code appears, click **Save**.

    ![alt text](img/install-4.png)

2.  Enable websocket debug by clicking **Enable**. This is important to see the URL and logs. This needs to be done only once.

    ![alt text](img/install-5.png)

3. Click **Start**

    ![alt text](img/install-6.png)

4.  Now you will see the URL address of the script control panel. Copy it and open in a new tab. Address is similar to `http://ip-osoite/script/1`.

    ![alt text](img/install-7.png)

5. Go back to scripts page and toggle **Run on startup**

    ![alt text](img/install-8.png)

6. Ready! Open the control panel in web browser (see step 11) and adjust the settings.

### Install manually

If you want to install manually, with the Shelly Smart Control app or [control.shelly.cloud](https://control.shelly.cloud), you can download the script from the following URL:

[https://raw.githubusercontent.com/david-nossebro/shelly-spotprice-se/master/dist/shelly-spotprice-se.js](https://raw.githubusercontent.com/david-nossebro/shelly-spotprice-se/master/dist/shelly-spotprice-se.js). 

## Updating script

If you want to update the script to a newer one, delete the active script and install the new using **Library** button.

All settings will be kept.

After installing, check that **Run on startup** is active.

## Shelly devices

At least these devices have been usesd successfully:

  * Shelly Plus 1PM
  * Shelly Plus 2PM
  * Shelly Plus 1
  * Shelly Pro 1
  * Shelly Pro 2
  * Shelly Pro 3
  * Shelly Pro 4PM
  * Shelly Pro3EM + Switch Add-on
  * Shelly Plus UNI
  * Shelly Plus 1 Mini
  * Shelly Plus Plug S
    * For color control, see [shelly-plug-nordpool-light](https://github.com/jisotalo/shelly-plug-nordpool-light)

## Settings

The script has up to three different controls that can be configured separately.
This allows controlling different outputs with separate rules on Shelly Pro devices. 

The active control is selected from the dropdown menu located on the top.
The UI displays status, history and settings for the selected control.

![alt text](img/instance-selection.png)

### Common settings

These are in common for all controls.

![alt text](img/common-settings.png)

| Setting       | Description                                                      | Example (figure above)   |
| ------------- | ---------------------------------------------------------------- | ------------------------ |
| Country       | Country to get prices for (Finland, Estonia, Latvia, Lithuania). | `Finland`                |
| VAT           | VAT-% t to add to electricity prices. [%]                        | `25.5`                   |
| Transfer fees | Transfer feeds added to electricity price (optional). [c/kWh]    | day: `4` <br> night: `3` |


### Control settings

These settings are separate for each control.

![alt text](img/instance-settings.png)

#### General

| Setting         | Description                                                                                                                                                                                                                                                                                                                            | Example (figure above)                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Enabled         | Is the control in use.                                                                                                                                                                                                                                                                                                                 | `ON`                                                                 |
| Name            | Freely given name for the control.                                                                                                                                                                                                                                                                                                     | `Heater`                                                             |
| Mode            | Control mode to use.<br><br>See below for more.                                                                                                                                                                                                                                                                                        | `cheapest hours`                                                     |
| Shelly outputs  | ID numbers of Shelly outputs to use.<br><br>If multiple, use comma to separate (max 4).<br><br>- One output  (Shelly Plus 1 etc.) --> `0`.<br>- Multiple (e.g. 0, 1 and 100) --> `0,1,100`                                                                                                                                             | `0`                                                                  |
| Write outputs   | Is the output written always or only when it's changed.<br><br>- **Always:** Output is commanded always after running the logic (every hour or so). All changes from elsewhere (Shelly App etc.) are overwritten.<br>- **Only when changed:** Output is commanded only if it has changed compared to the result of previous logic run. | `always`                                                             |
| Control minutes | Number of minutes of a hour to use. For example, if 30 minutes is always enough for heating, the output will be turned off after time has passed.                                                                                                                                                                                      | `60`                                                                 |
| Inverted        | If checked, the output is inverted. For example, if the active hour is among cheapest ones, output is set OFF.                                                                                                                                                                                                                         | `no`                                                                 |
| Backup hours    | If the electricity price is unknown and Shelly knows the active time, these hours are used instead.                                                                                                                                                                                                                                    | `01:00-07:00`                                                        |
| Emergency       | If Shelly doesn't know the active time, the output is set to this value                                                                                                                                                                                                                                                                | `ON`                                                                 |
| Overrides       | Can be used to set the output ON or OFF always on certain hours (no matter what is the price)                                                                                                                                                                                                                                          | at `05:00-07:00` and at `19:00-21:00` ON<br><br>at `01:00-02:00` OFF |

#### Manual mode

Used if the active mode is **manual**.

The output is commanded to the value selected.

![image](img/manual-mode.png)

| Setting | Description                 | Example (figure above) |
| ------- | --------------------------- | ---------------------- |
| Output  | Is the output set OFF or ON | `ON`                   |

#### Price limit

Used if the active mode is **price limit**.

In this mode, the output is set ON if electricity price is at or below the configured limit.

![image](img/price-limit.png)

| Setting     | Description                                                                                                   | Example (figure above) |
| ----------- | ------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Price limit | Price at or below the output is set ON. [c/kWh]<br><br>You can enter `avg` to use daily average as the limit. | `4.25`                 |

#### Chepeast hours

Used if the active mode is **cheapest hours**.

In this mode, the day is divided into periods. The output is set ON during the cheapest hours of each period.

Day can be divided into equal periods (e.g. every 8h) or you can enter custom time ranges (e.g. morning and evening).

![image](img/cheapest-hours.png)

| Setting          | Description                                                                                                                                                                                           | Example (figure above) |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Time period      | What kind of periods to divide the day into. Cheapest hours are selected from each period. [h]<br><br>You can also select `custom`.                                                                   | `6`                    |
| Hour count       | Number of cheapest hours to select.<br><br>If the period is 6h and hour count is 2h, between 00:00-06:00 the output is set ON during the two cheapest hours. Same thing during 06:00-12:00 and so on. | `2`                    |
| Sequential       | If checked, the hours are selected so that cheapest sequential hours are used (so single cheapest hours might not be selected in all cases)                                                           | `no`                   |
| Always on limit  | If electricity price is at or below this limit, the output is always ON. [c/kWh]<br><br>You can enter `avg` to use daily average as the limit.                                                        | `-0.5`                 |
| Max. price limit | If electricity is over this limit, the output is always OFF. [c/kWh]<br><br>You can enter `avg` to use daily average as the limit.<br><br>*Be careful with this one....*                              | `30`                   |

See example below for results using settings above (prices at 12.10.2023, Finnish version). Note the usage of background color to highlight periods.

![image](https://github.com/jisotalo/shelly-porssisahko/assets/13457157/b095bac2-4b95-4f1f-810c-51ae2bba98d9)

The following figures demonstrate the **sequential** setting. The examples have 4h period and hour count of 3.

**Not checked (default):**

Selecting three cheapest hours.

![image](https://github.com/jisotalo/shelly-porssisahko/assets/13457157/1d2b9eac-591b-4fa7-9b18-076483db1bc5)


**Checked:**

Selecting three sequential hours. The 17-19 is selected as the total average is lower than 16-18.

![image](https://github.com/jisotalo/shelly-porssisahko/assets/13457157/cfb23821-496b-477e-b352-b5828f7c5525)

### Chepeast hours - custom periods

It's also possible to enter one or two custom periods with  custom hour count for each. 
This can be used to achieve a common use case "*three cheapest hours during the night 00-06 and the cheapest hour in the evening during 18-21*".

If the period is selected as `custom`, the time periods can be entered manually.

![image](img/cheapest-hours-custom.png)

See the figure below for example operation for above setting (Finnish version).

 ![image](https://github.com/jisotalo/shelly-porssisahko/assets/13457157/d965c456-af99-406f-960c-a8154b79c8f4)

### Commands

![alt text](img/commands.png)

* **Manual override**
  * Allows overriding output for certain period of time to ON or OFF
  * Enter length of the override as hours (you can use decimals,  `0.5` = ½ hour)
* **Shelly Web UI**
  * Open Shelly Web UI in a new tab

## Addditional features by user scripts

User scripts can be used to add features. See some examples below.

| Script                                                                                                                                             | Description                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`shelly-spotprice-se-open-meteo-api.js`](https://github.com/david-nossebro/shelly-spotprice-se/blob/master/dist/shelly-spotprice-se-open-meteo-api.js)     | Fetches coldest temperature for the day and uses it to adjust number of cheapest hours                                                                                                                                                                                             |
| [`shelly-spotprice-se-addon-temp-hours.js`](https://github.com/david-nossebro/shelly-spotprice-se/blob/master/dist/shelly-spotprice-se-addon-temp-hours.js) | Adjusts number of cheapest hours based on Shelly Plus Addon temperature measurement                                                                                                                                                                                                |
| [`shelly-spotprice-se-addon-temp.js`](https://github.com/david-nossebro/shelly-spotprice-se/blob/master/dist/shelly-spotprice-se-addon-temp.js)             | Overrides the output based on Shelly Plus Addon temperature measurement, if needed.                                                                                                                                                                                                |
| [`shelly-spotprice-se-ht-sensor-temp.js`](https://github.com/david-nossebro/shelly-spotprice-se/blob/master/dist/shelly-spotprice-se-ht-sensor-temp.js)     | Adjusts number of cheapest hours based on Shelly H&T temperature measurement                                                                                                                                                                                                       |
| [`shelly-spotprice-se-config.js`](https://github.com/david-nossebro/shelly-spotprice-se/blob/master/dist/shelly-spotprice-se-config.js)                     | Script that is installed in parallel to the main script. Used to adjust settings without access to the control panel (e.g. remotely with Shelly Smart Control app) See [Adjusting settings with a separate script (remotely)](#adjusting-settings-with-a-separate-script-remotely) |

### User script features

Script calls the following functions if they are available. See above scripts for examples.

<small>

| Function        | Signature                                                                        | Parameters                                                                                                | Description                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `USER_CONFIG`   | `USER_CONFIG(inst: number, initialized: boolean) => void`                        | `inst` = control instance index (`0, 1, 2`)<br>`initialized` = settings have changed                      | Called when settins have changed and when the logic will be run. Can be used to change settings.                                                                           |
| `USER_OVERRIDE` | `USER_OVERRIDE(inst: number, cmd: boolean, callback: function(boolean)) => void` | `inst` = control instance index (`0, 1, 2`)<br>`cmd` = original command<br>`callback` = callback function | Called when logic has been run. The output by the logic can be overwritten before the output is commanded. The `callback()` **needs to be called** with final output value |
| `USER_LOOP`     | `USER_LOOP() => void`                                                            |                                                                                                           | Called from the script main loop if the script isn't doing anything (every 10s) The `loopRunning = false` needs to be set when finished.                                   |

</small>

### Adjusting settings with a separate script (remotely)

This method can be used to change settings remotely outside the local network (Shelly Smart Control app etc.)


1. Install with the library or manually [`shelly-spotprice-se-config.js`](https://github.com/david-nossebro/shelly-spotprice-se/blob/master/dist/shelly-spotprice-se-config.js) in parallel to the main script (keep main script running).
2. Remove comments (`//`) from the settings you want to adjust. All others are kept as-is.
3. Click **save** and start the script. It will stop automatically.

Example: Adjusting number of cheapest hours to `8h`.

![alt text](img/config-script.png)


## FAQ

### Why the script isn't getting prices?

Sometimes elprisetjustnu.se might have API issues. It's important to set backup hours for situations like this.

Check Diagnostics log in Shelly for errors. 
You can open the elprisetjustnu.se URL in web browser and see if the JSON file has valid data for 24 hours. If not, the script can't get the data either.

![alt text](img/error-getting-prices.png)

The address is similar to: [https://www.elprisetjustnu.se/api/v1/prices/2025/07-01_SE3.json](https://www.elprisetjustnu.se/api/v1/prices/2025/07-01_SE3.json)

### How reliable is this script?

The target is to create a script that can be installed once and then forgotten.

### Why I sometimes get HTTP error 503?

The script will answer with 503 when it's doing something (to save memory).

Try again.

### Why the device name says "not set"?

You haven't set a custom name for device. It can be set from Shelly Web UI: `Settings` -> `Device name`.

### How to use with Switch Add-On?

Tested with Shelly Pro3EM + Switch Add-on.

You will see the output number in Shelly control panel. In this example, it's `100`.

![image](https://github.com/jisotalo/shelly-porssisahko/assets/13457157/81babe94-1999-4890-ab80-c2f9ffbd54e0)

Use that value as `Shelly outputs` setting in this script.

### When the script reads the prices for tomorrow?

At 14:00 - elprisetjustnu.se offers the new prices at around 13:00, but to be sure that the prices are present we fetch them an hour later.

### Where are the settings saved to?

Shelly KVS memory (Advanced -> KVS). They are as JSON and can be freely edited manually.

Script needs to be restarted for the changes to take effect. 

![alt text](img/kvs.png)

### Why is the history length so short?

24 last control changes are saved to history to save memory.

- One control in use -> 24 last changes
- Two controls in use -> 12 last changes each
- Three controls in use -> 8 last changes each

## Technical info

### General

* Shelly is low on memory so many things are done in an ugly manner
* Some variables are at global scope because Shelly js engine stack issues
* The final script is done by "building" (minimizing, base64 encoding, gzipping)

### Building the script

1) Install Node.js 
2) Clone repository and open terminal in `shelly-porssisahko` folder
3) Run `npm i`
4) Run `npm run build`
5) Scripts are generated to `dist/`

## License

GNU Affero General Public License v3.0 - [LICENSE.txt](https://github.com/david-nossebro/shelly-spotprice-se/blob/master/LICENSE.txt)

Note that there is no warranty, use at your own risk. Tab system is based on [this example](https://alvarotrigo.com/blog/html-css-tabs/).