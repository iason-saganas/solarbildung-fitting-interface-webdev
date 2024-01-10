import {
    convert_string_to_unix_timestamp,
    convert_time_string_to_int,
    format_time,
    format_time_short,
    format_time_short_with_slash,
    swap_elements_of_arr_based_on_index,
    zip
} from "../graphs-custom-helper-functions";

import {grabDemoDataFromMasterCSV} from "../../backend/custom-media-backend";

import wixWindowFrontend from 'wix-window-frontend';
import {
    checkmark,
    global_information_window_log_in_success_generic,
    hide_loader
} from "../graphs-element-manipulation-functions";

const ALL = ['returnTimeAndPowerArrays_DemoSolution_Daily', 'postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily',
                        'createAndStoreCsvBlobInButton_GeneralSolution_Daily', 'findAndProcessData_DemoSolution_Daily',
                    'InitializeWorkspace_DemoSolution_Daily']

/**
 * Used to update the respective global variables of time, generation power and optionally consumption power.
 *
 * @param  {object} datePickerValue            : The datetime object representing the chosen date, value of the datepicker element.
 *
 * @return {Promise<object>}                   : A promise that resolves to an object containing the time array as the first,
 *                                               the generation array as the second, the consumption array as the third and
 *                                               dictionary containing triples of said values as the fourth element.
 *
 */
export async function returnTimeAndPowerArrays_DemoSolution_Daily(datePickerValue){
    let XArray = []
    let YArray = []
    let ZArray = []

    const date_in_correct_format = format_time_short_with_slash(convert_string_to_unix_timestamp(datePickerValue))
    const month = date_in_correct_format.split("/")[1]

    return grabDemoDataFromMasterCSV(month).then(data => {
        const line_by_line_data = data.split("\n").map(el=>el.replace(/(\r\n|\n|\r)/gm, "")); // split data line by line and remove extra '\r' breaks
        for (const line of line_by_line_data){
            const timestamp_of_data = line.split(" ")[0]            // something like 01/05/2023 (day/month/year)

            if (timestamp_of_data===date_in_correct_format){

                let xData_unedited = line.split(",")[0]        // but 'convert_string_to_unix_timestamp()' needs (month/day/year) so swap month and day
                xData_unedited = xData_unedited.split("")
                swap_elements_of_arr_based_on_index(xData_unedited, 0, 3)
                swap_elements_of_arr_based_on_index(xData_unedited, 1, 4)
                const xData_edited = xData_unedited.join("")
                const xData = convert_string_to_unix_timestamp(xData_edited)
                const yData = line.split(",")[1]
                const zData = line.split(",")[2]   // consumption data
                XArray.push(xData)
                YArray.push(yData)
                ZArray.push(zData)
            }
        }

        YArray = [YArray] // put another set of brackets around anything that represents power values (convention).
        ZArray = [ZArray] // put another set of brackets around anything that represents power values (convention).

        // create dictionary containing triples
        const zipOfYAndZ = zip([YArray[0], ZArray[0]])
        const zipOfXYZ = zip([XArray, zipOfYAndZ])

        // create dictionary via map
        const dictOfXYZ = Object.fromEntries(new Map(zipOfXYZ))

        // return X,Y,Z and those values packed as triples in 'dictOfXYZ'
        return [XArray, YArray, ZArray, dictOfXYZ]

    })
}

/**
 * Sends the command to update the value for the global time array in use on the Chart Js Daily Chart instance.
 *
 * @param  {Element}    chartJsInstance            : The chart js instance grabbed with '$w("...")'
 * @param   {Object}    XArray                     : The time array to update to.
 *
 * @return {void}                   : A promise that resolves to an object containing the time array as the first,
 *                                               the generation array as the second, the consumption array as the third and
 *                                               dictionary containing triples of said values as the fourth element.
 *
 */
export function postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily(chartJsInstance, XArray){
    chartJsInstance.postMessage([
            "Update universal x array (timestamps).",
            [
                XArray.map( el => convert_time_string_to_int ( format_time ( el ) ) )
            ]
    ]
    )
}

/**
 * Creates and stores a csv file at location $w('DownloadCSVhtml') using the values for X, Y, Z array.
 *
 * @param  {Element}    CsvDownloadButtonElement   : The button at which the csv blob is stored, grabbed by '$w("...")'. E.g. $w("#DownloadCSVhtml").
 * @param   {Object}    XArray                     : The time array to store.
 * @param   {Object}    YArray                     : The power generation array to store.
 * @param   {Object}    ZArray                     : The power consumption array to store.
 *
 * @return {void}
 *
 */

export function createAndStoreCsvBlobInButton_GeneralSolution_Daily(CsvDownloadButtonElement,XArray, YArray, ZArray){
    let language = wixWindowFrontend.multilingual.currentLanguage; // "en" or "es" or "de"
    let csv_columns_multilingual = ''

    if (language==="es"){
        csv_columns_multilingual = "Registró temporal;"+"Generacíon de energía en vatios;"+"Consumo de energía en vatios"+"\n"
    }
    else if (language==="en"){
        csv_columns_multilingual = "Timestamp;"+"Generation power in Watts;"+"Consumption power in Watts"+"\n"
    }
    else if (language==="de"){
        csv_columns_multilingual = "Zeitstempel;"+"Erzeugung in Watt;"+"Verbrauch in Watt"+"\n"
    }

    const zipOfYAndZ = zip([YArray[0], ZArray[0]])
    const zipOfXYZForCsv = zip([XArray.map(el=>'='+'"'+format_time_short(el).toString()+'"'), zipOfYAndZ])

    for (const i of zipOfXYZForCsv){
        // fill the columns with data.
        csv_columns_multilingual += i[0] + ";" + i[1][0] + ";" + i[1][1]
        csv_columns_multilingual += "\n"
    }

    let csvFile = new Blob([csv_columns_multilingual], {type: "text/csv"});
    CsvDownloadButtonElement.postMessage(['Store csv blob', csvFile])
}

/**
 * Encompasses the three functions 'returnTimeAndPowerArrays_DemoSolution_Daily()', 'postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily()'
 * and 'createAndStoreCsvBlobInButton_GeneralSolution_Daily()' into one.
 *
 * @param  {object}     datePickerValue            : The datetime object representing the chosen date, value of the datepicker element.
 * @param  {Element}    chartJsInstance            : The chart js instance grabbed with '$w("...")'
 * @param  {Element}    CsvDownloadButtonElement   : The button at which the csv blob is stored, grabbed by '$w("...")'. E.g. $w("#DownloadCSVhtml").
 *
 * @return {Promise<object>}    : A promise that resolves to a dictionary object containing triples of x, y and z values (time, generation, consumption).
 *
 */
export function findAndProcessData_DemoSolution_Daily(datePickerValue,chartJsInstance, CsvDownloadButtonElement){
    return returnTimeAndPowerArrays_DemoSolution_Daily(datePickerValue).then(result => {
        const [XArray, YArray, ZArray, dictOfXYZ] = result
        postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily(chartJsInstance, XArray)
        createAndStoreCsvBlobInButton_GeneralSolution_Daily(CsvDownloadButtonElement,XArray, YArray, ZArray)
        return dictOfXYZ

    })
}



/**
 * All 'InitializeWorkspace_<CustomerSolution>_Daily' functions have the appendix "Daily", because that is the standard selection when the fitting interface
 * is loaded.
 *
 * @param   {Element}   GlobalInformationWindow    : Something like $w('#GlobalInformationWindow').
 * @param   {Element}   RadioGroupInstallations    : Something like $w("#radioGroupInstallations").
 * @param   {Element}   DailyDatePicker            : Something like $w("#DailyDatePicker").
 * @param   {Element}   NameOfSchoolText           : Something like $w("#NameDerSchule").
 * @param   {Element}   DailyChartJSInstance       : Something like $w("#ChartJsDaily").
 * @param   {Element}   Loader                     : Something like $w('#LoadingDots1').
 * @param   {Element}   Checkmark                  : Something like $w('#CheckmarkHTML1').
 *
 * @return {string}
 *
 */
export function InitializeWorkspace_DemoSolution_Daily(GlobalInformationWindow, RadioGroupInstallations, DailyDatePicker, NameOfSchoolText, DailyChartJSInstance, Loader, Checkmark){

        global_information_window_log_in_success_generic(GlobalInformationWindow)
        hide_loader(Loader)
        checkmark(Checkmark)


        let language = wixWindowFrontend.multilingual.currentLanguage; // "en" or "es" or "de"
                let radio_label = null
                if (language === "es"){
                    radio_label = "Techado"
                }
                else if (language === "en"){
                    radio_label = "Roof"
                }
                else if (language === "de"){
                    radio_label = "Dach"
                }



        RadioGroupInstallations.enable()
        RadioGroupInstallations.options = [{"label": `${radio_label}`, "value": "727738"}];
        RadioGroupInstallations.selectedIndex = 0 // sets "roof" to be auto-selected for demo data


        let enabledDates = []
        enabledDates.push({
            startDate: new Date(format_time(convert_string_to_unix_timestamp('01/01/2022 00:00'))),
            endDate: new Date(format_time(convert_string_to_unix_timestamp('12/31/2022 23:59')))
        })
        DailyDatePicker.enabledDateRanges = enabledDates
        DailyDatePicker.value = new Date(format_time(convert_string_to_unix_timestamp('06/20/2022 00:01')))

        NameOfSchoolText.text = "Demo"
        DailyChartJSInstance.postMessage(["Clear any existing fits.", []])

        return 'success'

}