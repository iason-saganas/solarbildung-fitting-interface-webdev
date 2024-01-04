import {
    convert_string_to_unix_timestamp, convert_time_string_to_int, format_time, format_time_short,
    format_time_short_with_slash,
    swap_elements_of_arr_based_on_index, zip
} from "../public/graphs-custom-helper-functions";

import {
    grabDemoDataFromMasterCSV
} from "../backend/custom-media-backend";

import wixWindowFrontend from 'wix-window-frontend';

/**
 * Updates the respective global variables of time, generation power and optionally consumption power.
 *
 * @param  {string} datePickerValue            : The string representing the chosen date, value of the datepicker element.
 *
 * @return {Promise<Object>}                   : A promise that resolves to an object containing the time array as the first,
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
 * Updates the value for the global time array in use on the Chart Js Daily Chart instance.
 *
 * @param  {Element}    chartJsInstance            : The chart js instance grabbed with '$w("...")'
 * @param   {Object}    XArray                     : The time array to update to.
 *
 * @return {void}                   : A promise that resolves to an object containing the time array as the first,
 *                                               the generation array as the second, the consumption array as the third and
 *                                               dictionary containing triples of said values as the fourth element.
 *
 */
export function postMessageToChartJsUpdateTimeArray_DemoSolution_Daily(chartJsInstance, XArray){
    chartJsInstance.postMessage(["UniversalXarrayUpdate",XArray.map(el=>convert_time_string_to_int(format_time(el)))])
}

/**
 * Creates and stores a csv file at location $w('DownloadCSVhtml') using the values for X, Y, Z array.
 *
 * @param  {Element}    CsvDownloadButtonElement   : The button at which the csv blob is stored, grabbed by '$w("...")'. E.g. $w("#DownloadCSVhtml").
 * @param   {Object}    XArray                     : The time array to store.
 * @param   {Object}    YArray                     : The power generation array to store.
 * @param   {Object}    ZArray                     : The power consumption array to store.
 *
 * @return {void}                   : A promise that resolves to an object containing the time array as the first,
 *                                               the generation array as the second, the consumption array as the third and
 *                                               dictionary containing triples of said values as the fourth element.
 *
 */

export function createAndStoreCsvBlobInButton_DemoSolution_Daily(CsvDownloadButtonElement,XArray, YArray, ZArray){
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

    const zipOfYAndZ = zip([YArray, ZArray])
    const zipOfXYZForCsv = zip([XArray.map(el=>'='+'"'+format_time_short(el).toString()+'"'), zipOfYAndZ])

    for (const i of zipOfXYZForCsv){
        // fill the columns with data.
        csv_columns_multilingual += i[0] + ";" + i[1][0] + ";" + i[1][1]
        csv_columns_multilingual += "\n"
    }

    let csvFile = new Blob([csv_columns_multilingual], {type: "text/csv"});
    CsvDownloadButtonElement.postMessage(['Store csv blob', csvFile])
}