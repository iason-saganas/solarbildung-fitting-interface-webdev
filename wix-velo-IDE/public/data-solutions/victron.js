import {
    checkmark,
    global_information_window_log_in_success,
    global_information_window_log_in_failure,
    hide_loader,
    crossmark
} from "../graphs-element-manipulation-functions";

import {
    findBasicSchoolInformationFromID_VictronSolution,
    getAllEnabledDates_VictronSolution,
    returnTimeAndPowerArrays_VictronSolution_Daily
} from "../../backend/custom-http";

import {
    convert_string_to_unix_timestamp, convert_time_string_to_int, format_time, format_time_short, zip
} from "../graphs-custom-helper-functions";
import {
    createAndStoreCsvBlobInButton_GeneralSolution_Daily,
    postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily
} from "./demo";


const ALL = ['returnPowerData_VictronSolution', 'InitializeWorkspace_VictronSolution_Daily', 'constructStartEndArray_VictronSolution',
                    'findAndProcessData_VictronSolution_Daily']

/**
 * Converts a unix timestamp fetched from the Victron vrm api to a string representing the actual date.
 * E.g: format_time(1687387972) = 21 Jun 2023 22:52:52
 *
 * @param  {Number} date      :   The Unix Timestamp that is to be converted
 *
 * @return {String}                     :   The converted String that represents the actual date in format Day Month Year Hour:Minutes:Seconds
 *
 */
export function returnPowerData_VictronSolution(data){

}


/**
 * All 'InitializeWorkspace_<CustomerSolution>_Daily' functions have the appendix "Daily", because that is the standard selection when the fitting interface
 * is loaded.
 *
 * @param   {string}    siteID                     : The identifier associated with the site (number represented as string).
 * @param   {Element}   loader                     : Something like $w('#LoadingDots1')
 * @param   {Element}   crossmarkInstance          : Something like $w('#CrossmarkHTML1')
 * @param   {Element}   checkmarkInstance          : Something like $w('#CheckmarkHTML1')
 * @param   {Element}   globalInformationWindow    : Something like $w('#GlobalInformationWindow').
 * @param   {Element}   radioGroupInstallations    : Something like $w("#radioGroupInstallations").
 * @param   {Element}   dailyDatePicker            : Something like $w("#DailyDatePicker").
 * @param   {Element}   nameOfSchoolText           : Something like $w("#NameDerSchule").
 * @param   {Element}   dailyChartJSInstance       : Something like $w("#ChartJsDaily")
 *
 * @return {Promise<string>}    A promise that resolves to 'failure' or 'success'
 *
 */
export function InitializeWorkspace_VictronSolution_Daily(siteID,loader, crossmarkInstance,checkmarkInstance,  globalInformationWindow, radioGroupInstallations, dailyDatePicker, nameOfSchoolText, dailyChartJSInstance) {

    return findBasicSchoolInformationFromID_VictronSolution(false , siteID).then(data =>{
        // hide the loading dots, then determine whether site associated with ID was found
        hide_loader(loader)
        let listOfInstallationsOfSite = Object.keys(data)
        if (listOfInstallationsOfSite.length === 0){
            // handle error: "No Site found."
            crossmark(crossmarkInstance)
            global_information_window_log_in_failure(globalInformationWindow)
            return 'failure'
        }
        else {
            // handle success: "Site was found."
            checkmark(checkmarkInstance)
            global_information_window_log_in_success(globalInformationWindow)

            // name of the school
            nameOfSchoolText.text = data[0].installationName.split(",")[0]+", "+ data[0].installationName.split(",")[1]

            // fill radio group with all installations found for the site
            radioGroupInstallations.enable()
            let radioOptions = []
            for (const i of listOfInstallationsOfSite){
                radioOptions.push({"label": data[i].installationName.split(",")[2], "value": data[i].installationID.toString()})
            }
            // if more than one installation on a site, let the user be able to choose sum of all installations
            if (listOfInstallationsOfSite.length > 1){
                radioOptions.push({"label": "Summe (in Bearb.)", "value": "000000"})
            }
            radioGroupInstallations.options = radioOptions

            // set the min and max date on the calendar
            const timestampCreationInstallation = convert_string_to_unix_timestamp(data[0].installationCreationDate)
            const datetimeObjectCreationInstallation = new Date(format_time(timestampCreationInstallation))
            let today = new Date()
            dailyDatePicker.minDate = datetimeObjectCreationInstallation
            dailyDatePicker.maxDate = today

            // now fill the calendar only with those dates on which data exists!
            const startEndArray = constructStartEndArray_VictronSolution(timestampCreationInstallation)
            return getAllEnabledDates_VictronSolution(siteID, startEndArray).then(results => {
                let enabledDates = []
                for (const enabledDateUnixTimestamp of results){
                    const enabledDateDatetimeObject = new Date(enabledDateUnixTimestamp * 1000)
                    enabledDates.push({
                        startDate: enabledDateDatetimeObject,
                        endDate: enabledDateDatetimeObject
                    })
                }
                dailyDatePicker.enabledDateRanges =  enabledDates
                // set standard value for the day as the last day at which data was found
                const lastIndex = enabledDates.length-1
                dailyDatePicker.value =  enabledDates[lastIndex]["startDate"]
                return 'success'
            })

        }
    })
}


/**
 * Constructs the 'startEndArray' object that is to be used inside the 'InitializeWorkspace_VictronSolution_Daily()' function (this file).
 * It is to be used in that file, because that is where 'findBasicSchoolInformationFromID_VictronSolution()' is called and in the '.then()' callback
 * of that function, there is access to the 'timestampCreationInstallation' constant, which is needed to properly construct this array.
 * This array is compatible with and gets passed as an argument to the 'getAllEnabledDates_VictronSolution()' function, from the file
 * 'custom-http.jsx'. The latter function is, again, called inside the 'findBasicSchoolInformationFromID_VictronSolution()' '.then()' callback.
 *
 * On the basis that victron allows to sample whether data was logged on a given day in the maximum time intervall of 365 days,
 * the by this function returned startEndArray is constructed as follows:
 *
 * Start with the datetime objects associated with 'timestampCreationInstallation' and 'today'. Calculate the distance between
 * those two dates and divide by 365. If the results is smaller than or equal to one, return an array containing one element,
 *
 *  [ ['timestampCreationInstallation', 'today'], ]
 *
 * corresponding to one http call in the 'custom-http.jsx/getAllEnabledDates_VictronSolution()' function.
 * If the result is bigger than one, add 365 days to 'timestampCreationInstallation'. Define this to be the
 * secondaryElement:
 *
 * secondaryElement := 365 + 'timestampCreationInstallation'
 *
 * Then, push the element
 *
 *  [ ['timestampCreationInstallation', 'secondaryElement'], ]
 *
 * into the array. Repeat until 'secondaryElement' > 'today', in which case finalize the array through
 *
 *  [ ['timestampCreationInstallation', 'secondaryElement1'], ..., ['secondaryElement2', 'lastBeforeSecondaryElement'],
 *  ['lastBeforeSecondaryElement', 'today'] ]
 *
 * @param   {number}    unixTimestampCreationInstallation  : The unix timestamp registered with the creation of an installation.
 *
 * @return {object} startEndArray
 *
 */
function constructStartEndArray_VictronSolution(unixTimestampCreationInstallation){
    const currentDateUnixTimestamp = Math.floor(new Date().getTime()/1000)
    const distance = currentDateUnixTimestamp - unixTimestampCreationInstallation
    let quotient = distance / 365
    let startEndArray = []
    if (quotient <= 1){
        const start = unixTimestampCreationInstallation
        const end = currentDateUnixTimestamp
        startEndArray.push([start, end])
    }
    else {
        let secondaryElementUnixTimestamp = unixTimestampCreationInstallation + 365 * 24 * 3600
        while (secondaryElementUnixTimestamp < currentDateUnixTimestamp){
            if (startEndArray.length === 0){
                // No elements in 'startEndArray' => First element should be 'unixTimestampCreationInstallation'
                startEndArray.push([unixTimestampCreationInstallation, secondaryElementUnixTimestamp])
            }
            else {
                // Elements in 'startEndArray' => First element should be the second element of the array that currently
                // sits as the last element in 'startEndArray'
                const helper = startEndArray[startEndArray.length-1]
                const start = helper[1]
                const end = secondaryElementUnixTimestamp
                startEndArray.push([start, end])
            }
            secondaryElementUnixTimestamp += 365 * 24 * 3600
        }
        // while loop finished => secondaryElementUnixTimestamp > currentDateUnixTimestamp => Append the second element
        // of the last array in 'startEndArray' together with 'today' to 'startEndArray'
        const helper = startEndArray[startEndArray.length-1]
        const start = helper[1]
        const end = currentDateUnixTimestamp
        startEndArray.push([start, end])
    }

    return startEndArray

}



/**
 * Encompasses the three functions 'custom-http.jsx/returnTimeAndPowerArrays_VictronSolution_Daily()', 'postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily()'
 * and 'createAndStoreCsvBlobInButton_GeneralSolution_Daily()' into one.
 *
 * @param  {object}     datePickerValue            : The datetime object representing the chosen date, value of the datepicker element.
 * @param  {string}     SiteID                     : The Victron's Site ID. Passed as e.g. '$w("#radioGroupInstallations").value'
 * @param  {Element}    chartJsInstance            : The chart js instance grabbed with '$w("...")'
 * @param  {Element}    CsvDownloadButtonElement   : The button at which the csv blob is stored, grabbed by '$w("...")'. E.g. $w("#DownloadCSVhtml").
 *
 * @return {Promise<object>}    : A promise that resolves to a dictionary object containing triples of x, y and z values (time, generation, consumption).
 *
 */
export function findAndProcessData_VictronSolution_Daily(datePickerValue,SiteID, chartJsInstance, CsvDownloadButtonElement){
    console.log("Date that is passed to 'victron.js/findAndProcessData_VictronSolution_Daily()' function: ",  datePickerValue)
    return returnTimeAndPowerArrays_VictronSolution_Daily(false,SiteID, datePickerValue).then(result => {
        console.log("I FOOOUND : ", result)
        const [XArray, YArray, ZArray, dictOfXYZ] = result
        postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily(chartJsInstance, XArray)
        createAndStoreCsvBlobInButton_GeneralSolution_Daily(CsvDownloadButtonElement,XArray, YArray, ZArray)
        return dictOfXYZ

    })
}

export function fineTuneEnabledDateRanges_VictronSolution_Daily(){

}