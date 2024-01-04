const ALL = ['zip', 'swap', 'create_latex_param', 'format_time', 'format_time_short', 'format_time_by_hours',
                        'format_time_short_with_slash', 'convert_time_string_to_int', 'calculate_month_difference', 'create_parameter_list_for_copy_to_clipboard',
                        'add_months_to_date', 'sum_of_arrays', 'swap_elements_of_arr_based_on_index', 'rounded_float_array', 'create_standard_consumption_samples',
                        'create_geogebra_command_string', 'convert_string_to_unix_timestamp']

/**
 * zips two arrays. I.e. zip( [ [1,2,3] , [4,5,6] ] ) = [ [1, 4] , [2, 5] , [3, 6]]
 *
 * @param  {Object} arrays : A array of length 2 that contains the to be zipped arrays
 *
 * @return {Object}        : An array of length 1 containing array objects combining the elements of the two input arrays
 *
 */
export function zip(arrays) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
}


/**
 * Swaps the last two elements of an array object. I.e. swap( [1, 2, 3] ) = [3, 2, 1].
 *
 * @param  {Object} array :   An array object
 *
 * @return {Object}       :   The original array but with swapped first and last element
 *
 */
export function swap(array) {
    [array[0], array[array.length - 1]] = [array[array.length - 1], array[0]];
    return array;
}


/**
 * For a given function name and a list containing some parameters, this returns a string that can be interpreted by
 * the ParameterGenCodeHTML HTML as Latex.
 *
 * @param  {String} functionName    :   The function names returned from calling the Python Fitting Script with HTTP.
 *                                      One of ["Polynomial", "Gaussian", "Cosine"] (as of 22.06.2023)
 * @param {Object}  listOfParams    :   The parameter values to be inserted into the latex code.
 *
 * @return {String}                 :   String that can be interpreted as latex containing the parameter names a,b,c etc and their numeric values
 *
 */
export function create_latex_param(functionName,listOfParams){
    const letters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o"]
    letters.length = listOfParams.length
    var stringArr = []
    if (functionName === "Polynomial"){
        // if the chosen mathematical function to use in the fit is of type "Polynomial":
        // The Polynomial.js library used in Html1 has a different definition for "Polynomial" as the Python Fitting Script.
        // Polynomial.js: quadratic ~ a + bx + c^2      Python Fitting Script: quadratic ~ ax + bx^2 + c
        // Before giving the parameters to be displayed in html1, swap the last two parameters of PoptGeneration


        listOfParams = listOfParams.reverse()
        // Actually, as a test lets reverse the whole array because I have seen some weird behaviour
    }
    for (const i of zip([letters,listOfParams])){
        const optimalParameters = i[1].toString()
        const letter = i[0]
        stringArr += "$$" + letter + " = " + optimalParameters +"$$"

    }
    return stringArr.toString()
}



/**
 * Converts a unix timestamp fetched from the Victron vrm api to a string representing the actual date.
 * E.g: format_time(1687387972) = 21 Jun 2023 22:52:52
 *
 * @param  {Number} UNIX_timestamp      :   The Unix Timestamp that is to be converted
 *
 * @return {String}                     :   The converted String that represents the actual date in format Day Month Year Hour:Minutes:Seconds
 *
 */
export function format_time(UNIX_timestamp){
    // The js Date objects works with milliseconds, a unix timestamp is in seconds => Multiply with 1000 before processing
    let a = new Date(UNIX_timestamp * 1000);
    let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let year = a.getFullYear();
    let month = months[a.getMonth()];
    let date = a.getDate();
    let hour = a.getHours();
    let min = a.getMinutes();
    let sec = a.getSeconds();
    return date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
}

/**
 * Does the same as format_time() but returning the date with "." instead of " " and without seconds.
 * E.g: format_time_short(1687387972) = 21.06.23 22:52
 *
 * @param  {Number} UNIX_timestamp      :   The Unix Timestamp that is to be converted
 *
 * @return {String}                     :   The converted String that represents the actual date in format Day.Month.Year Hour:Minutes
 *
 */
export function format_time_short(UNIX_timestamp){
    let a = new Date(UNIX_timestamp * 1000);
    let months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    let year = a.getFullYear().toString();
    let month = months[a.getMonth()];
    let dateNoShadow = a.getDate().toString();
    let hour = a.getHours().toString();
    let min = a.getMinutes().toString();
    if (dateNoShadow.length===1){dateNoShadow="0"+dateNoShadow}
    if (hour.length===1){hour="0"+hour}
    if (min.length===1){min="0"+min}
    return dateNoShadow + '.' + month + '.' + year.slice(2, 4) + ' ' + hour + ':' + min
}

/**
 * Does the same as format_time() but returning only the hours and minutes as one float
 * E.g: format_time_by_hours(1687387972) = 22.866
 *
 * @param  {Number} UNIX_timestamp      :   The Unix Timestamp that is to be converted
 *
 * @return {number}                     :   The converted String that represents the actual date in format Day.Month.Year Hour:Minutes
 */
export function format_time_by_hours(UNIX_timestamp){
    let a = new Date(UNIX_timestamp * 1000);
    let hour = a.getHours()
    let min = a.getMinutes()
    return hour + min / 60
}


/**
 * Does the same as format_time() but returning the date with "/" instead of " " and without hours/minutes/seconds. Full year.
 * E.g: format_time_short(1687387972) = 21/06/2023
 *
 * @param  {Number} UNIX_timestamp      :   The Unix Timestamp that is to be converted
 *
 * @return {String}                     :   The converted String that represents the actual date in format Day.Month.Year Hour:Minutes
 *
 */
export function format_time_short_with_slash(UNIX_timestamp){
    let a = new Date(UNIX_timestamp * 1000);
    let months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    let year = a.getFullYear().toString();
    let month = months[a.getMonth()];
    let dateNoShadow = a.getDate().toString();
    let hour = a.getHours().toString();
    let min = a.getMinutes().toString();
    if (dateNoShadow.length===1){dateNoShadow="0"+dateNoShadow}
    if (hour.length===1){hour="0"+hour}
    if (min.length===1){min="0"+min}
    return dateNoShadow + '/' + month + '/' + year
}


/**
 * Takes the output of format_time() and turns it into an integer representing the hours passed
 * E.g: format_time(1687387972) = 21 Jun 2023 22:52:52
 *      format_time(1687362265) = 21 Jun 2023 15:44:25
 *
 *      turnTimeStringToInt(21 Jun 2023 22:52:52) = 22.87
 *      turnTimeStringToInt(21 Jun 2023 15:44:25) = 15.73
 *
 * @param  {String} string              :   The full output of format_time() representing a date
 *
 * @return {Number}                     :   The date stripped away of day, year etc. only leaving the hours and minutes represented by one number
 *
 */
export function convert_time_string_to_int(string){
    if (string!==""){
        const hourstring = string.split(" ")[3]
        const hoursplit = hourstring.split(":")
        const hours = +hoursplit[0]
        const minutesinhours = +hoursplit[1]/60
        //round correctly to two decimals and return value
        const result = hours+minutesinhours
        const resultRounded = Math.round((result + Number.EPSILON) * 100) / 100
        return resultRounded
    }
    else {
        return 0
    }
}


/**
 * Computes the month difference between two dates. A date object can be constructed with new Date(format_time(unix_timestamp)).
 *
 * @param   {object} d1                 :   First Date object.
 * @param   {object} d2                 :   Second Date object
 *
 * @return  {Number}                    :   The difference in months of d1 and 2
 *
 */
export function calculate_month_difference(d1, d2) {
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}


/**
 *  AS OF 08.08.2023:   NOT USED. Keep in case needed in the future.
 * Creates a string representing a dictionary of the generation parameters and their values
 *
 * @param   {string} functionName                 :   The function name. One of {'Polynomial', 'Cosine',}
 * @param   {object} listOfParams                 :   Second Date object
 *
 * @return  {string}                              :   A comma seperated string containing the generation parameters
 */
export function create_parameter_list_for_copy_to_clipboard(functionName,listOfParams){
    let Arr = []
    if (functionName==="Polynomial"){
        listOfParams = swap(listOfParams)
        // dreh die letzten beiden Parameter um, weil der LatexGen String der PyCharm Konvention folgt und die erlangten Parameter der JS Konvention
    }
    for (const optimalParameter of listOfParams){
        Arr.push(optimalParameter)
    }
    return Arr.toString()
}



/*  NOTE FROM 08.08.2023:  TO BE IMPLEMENTED IN THE FUTURE IN THE MAIN CODE SITE
 * Queries time stamps and power generation data from the VRM api for all installations by constructing the sum of the generation in Watts.
 * @param   {type} name                 :   description
 * @return  None


async function returnPowerDataSumOverAllInstallations(debug,correctedDateDayBefore,correctedDateCurrent){
     const installationOptions = $w("#radioGroupInstallations").options
     var listOfAllIds = []
     for (const i of installationOptions){
         if (i.label!="Summe"){
             listOfAllIds.push(i.value)
         }
     }
     universalYarray.length = 0
     for (const ID of listOfAllIds){
        await fetchDownloadData(debug,ID,toTimestamp(correctedDateDayBefore)+3600,toTimestamp(correctedDateCurrent)+3600).then(DictOfXandYvalues=>{
            const lengthOfPowerData = Object.keys(DictOfXandYvalues).length


        if (lengthOfPowerData<50 || DictOfXandYvalues=="NoData" || Math.max(...Object.values(DictOfXandYvalues))<7){
            $w("#errorGroup").show()
            $w("#HTTPupdateBox").hide()
            console.log("The returned data list is empty or too small. It is set manually to []")
            return []
        }
        else {
            $w("#htmlLoadingCircle").postMessage(["click toggle button"])
            setTimeout(()=>{ $w("#HTTPupdateBox").hide() },1000);
            setTimeout(()=>{ $w("#htmlLoadingCircle").postMessage(["untoggle"]) },1200);
            universalXarray.length = 0
            for (const key of Object.keys(DictOfXandYvalues)){universalXarray.push(+key)}
            if (universalYarray.length == 0){universalYarray.push(Object.values(DictOfXandYvalues))}
            else {universalYarray = sumOfArrays(universalYarray,Object.values(DictOfXandYvalues))}
            $w("#html1").postMessage(["UniversalXarrayUpdate",universalXarray])
            return DictOfXandYvalues
        }
        })
     }
}
 */


/**Takes a string representing a date and converts it to a unix-timestamp in seconds instead of milliseconds for victron API.
 * @param   {string} strDate    :   A string representing a date, in format "Month/Day/Year hours:minutes" e.g. "02/10/2023 22:59".
 *
 * @return  {number} timestamp  :   The timestamp in seconds representing the date.
 */
export function convert_string_to_unix_timestamp (strDate) {
    const dt = Date.parse(strDate);
    // turn milliseconds into seconds
    return dt / 1000
}


/**
 * Takes a datetime object (e.g. created by calling 'format_time()' onto a unix-timestamp) and adds a fixed amount of months to it.
 * Returns the updated datetime object in STRING representation..
 *
 * @param   {Date} date                     :   The datetime object onto which to add the months.
 * @param   {number} numOfMonthsToAdd       :   Number of months to add.
 *
 * @return  {string} updated_date           :   The updated datetime object in string representation.
 */
export function add_months_to_date(date,numOfMonthsToAdd){
    return format_time(new Date(date).setMonth(date.getMonth() + numOfMonthsToAdd) / 1000)
}


/**
 *  AS OF 08.08.23: NOT USED. Keep since might be useful in the future.
 *
 * @param   {object} arr1          :   Array 1 consisting of floats
 * @param   {object} arr2          :   Array 2 consisting of floats
 *
 * @return  {object}               :   The pointwise sum of the two inputted arrays.
 */
function sum_of_arrays(arr1,arr2){
    return arr1.map(function (num, idx) {
        return num + arr2[idx];
    })}


/**
 *  Swaps elements of an array based on the indices of the to be swapped elements.
 *  Example usage:
 *      str = "02/05/2023 23:55"
 *         arr = str.split("")
 *
 *         swapElements(arr, 0, 3)
 *         swapElements(arr, 1, 4)
 *
 *         console.log(arr.join("")) // => 05/02/2023 23:55
 *
 * @param   {object} array          :   The array to perform the operation on.
 * @param   {number} index1         :   The index of the first element.
 * @param   {number} index2         :   The index of the second element that is to be swapped with the first element.
 *
 * @return  {object}                :   The swapped array.
 */
export const swap_elements_of_arr_based_on_index = (array, index1, index2) => {
    let temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
};


/**
 *  JS equivalent to the functionality of NumPys 'np.linspace()'. Difference in the third argument!
 *
 * @param   {number} start          :   The first element of the array
 * @param   {number} stop           :   The index of the first element.
 * @param   {number} step           :   NOT the number of total elements in the array, but the distance between two points in the array.
 *
 * @return  {Object} roundedFloatArray     :   The rounded float array.
 */
export function rounded_float_array(start,stop,step){
    return Array.from({length:(stop-start)/step+1},(value,index)=> Math.round((start+index*step + Number.EPSILON) * 100) / 100)
}

/**
 *  Creates standard consumption samples based out of a ground load (20 Watts) and then gaussian random samples of a fitted polynomial curve.
 *  The polynomial curve is a fit from reference data from 'live-solar-data-demo'. The base load is preferred in the time window 0:00-04:00 and 17:00-24:00.
 *
 * @param   {Object} x_array         :   The time array to compute samples for.
 *
 * @return  {Object} consumption_array     :   The standard random consumption array.
 */
export function create_standard_consumption_samples(x_array){
    const base_level = 20
    let consumption_array = []
    for (const time_sample of x_array){
        if (time_sample<4 || time_sample>17){
            // base load is preferred, let the sample wiggle a little bit about it
            consumption_array.push(base_level*Math.random())
        }
        else {
            // curved fit function is preferred. Construct the curve fit with fixed parameters and then add noise to it.
            consumption_array.push(0)
        }
    }
    return consumption_array
}


/**
 *  Creates the Geogebra string command that can be pasted into a text field in Geogebra and evaluated with Javascript,
 *  such that objects and data from fitting interface are displayed there.
 *
 * @param   {Object} xArray                 :   The time array.
 * @param   {Object} yArray                 :   The generation power array.
 * @param   {Object} y2Array                :   The consumption power array.
 * @param   {Object} latexGeneration        :   The latex generation string.
 * @param   {Object} latexConsumption       :   The latex consumption string.
 *
 * @return  {string} geogebraCMD     :   The string representing different geogebra commands.
 */
export function create_geogebra_command_string(xArray, yArray, y2Array, latexGeneration, latexConsumption){
    // the Xarray is the time array, Yarray the power array, Y2array the consumption array

    const time_array =  xArray.map(el=>format_time_by_hours(el)) // universal X array inhours and minutes instead of a timestamp
    const power_array_unpacked = yArray[0].map(el=>+el)
    const consumption_array_unpacked = y2Array[0].map(el=>+el)

    const time_power_tuples = zip([time_array, power_array_unpacked])
    const time_consumption_tuples = zip([time_array, consumption_array_unpacked])

    var time_consumption_tuples_string = "" // turn to string via if loop to conserve brackets, which a removed in the template string interpolation due to JS type coercion
    for (const el of time_consumption_tuples){
        time_consumption_tuples_string = time_consumption_tuples_string + "["+el.toString()+"],"
    }

    var time_power_tuples_string = ""
    for (const el of time_power_tuples){
        time_power_tuples_string = time_power_tuples_string + "["+el.toString()+"],"
    }



    const str1 = 'for (tuple of [' + time_power_tuples_string.slice(0, -1) +'])' // inject array. I am removing the last element of the variable because it is a comma and would
    // therefore obstruct the closing bracket.
    const str2 = "{ggbApplet.evalCommand(`(${tuple[0]},${tuple[1]})`)};" // inject array elements
    const str3 = "yellow_points = ggbApplet.getAllObjectNames('Point');"// save array of those points that should be colored in yellow

    // repeat command loop for consumption details

    const str4 = 'for (tuple of [' + time_consumption_tuples_string.slice(0, -1) +'])' // inject array.
    const str5 = "{ggbApplet.evalCommand(`(${tuple[0]},${tuple[1]})`)};" // inject array elements
    const str6 = "for (el of ggbApplet.getAllObjectNames('Point')){ggbApplet.setColor(el,31,59,93); ggbApplet.setLabelVisible(el, false)}"// set color and caption of points
    const str7 = "for (el of yellow_points){ggbApplet.setColor(el,255,205,17)};"// set color of yellow points

    // create the functions f(x) and g(x)
    const str8 = `ggbApplet.evalCommand('l1(x)${latexGeneration.replace("cdot","")}');`
    const str9 = `ggbApplet.evalCommand('l2(x)${latexConsumption.replace("cdot","")}');`

    // color them in
    const str10 = "ggbApplet.setColor('l1', 227, 184, 23);"
    const str11 = "ggbApplet.setColor('l2', 25, 49, 79);"

    return str1 + str2 + str3 + str4 + str5 + str6 + str7 + str8 + str9 + str10 + str11


}