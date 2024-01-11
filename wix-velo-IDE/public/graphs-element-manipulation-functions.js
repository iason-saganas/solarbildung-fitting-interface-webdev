import {returnPowerData} from "../backend/custom-media-backend";
import {returnTimeAndPowerArrays_VictronSolution_Daily} from "../backend/custom-http";

const ALL_STYLISTIC = ['hide_element', 'global_information_window_update_attributes', 'global_information_window_log_in_success_generic',
                        'global_information_window_log_in_success_victron','global_information_window_log_in_failure', 'checkmark', 'crossmark', 'show_loader', 'hide_loader',
                        'change_graph_style_to_point', 'change_graph_style_to_bar', 'reset_results_from_fit_and_hide_texts', 'initialize_fit_results_texts',
                        'show_consumption_fit_dials', 'hide_consumption_fit_dials', 'wipe_interface_clean', 'hide_weekly_dials_show_daily_dials',
                        'hide_daily_dials_show_weekly_dials']

const ALL_DATA = []


/**

                            S T Y L I S T I C   M A N I P U L A T I O N   F U N C T I O N S
*/


/**
 * Gets the secrete demo key using Wix Velo API and checks if input is equal to that.
 *
 * @param  {Element} selectedElement : The with '$w("#ID")' selected element.
 *
 * @return {void}
 *
 */
export function hide_element(selectedElement){
    selectedElement.hide()
}

/**
 * Gets the input and constructs (fades in and fades out) the custom-built global information window.
 *
 * @param  {Element} globalWindow       : The global information window object grabbed with w$('#ID').
 * @param  {string} icon_url            : The URL of the media to display left next to the message.
 * @param  {string} background_color    : The background color of the div.
 * @param  {string} color               : The text color.
 * @param  {string} font_size           : The font size, e.g. in px or em.
 * @param  {string} icon_height         : The height of the icon in e.g. em.
 * @param  {string} text_message        : The text message to display.
 * @param  {string} time_out            : How long to display the message before it vanishes.
 * @param  {string} set_visible         : 'true' or 'false'. Should the global message window become visible?
 *
 * @return {void}
 *
 */
export function global_information_window_update_attributes(globalWindow,icon_url, background_color, color, font_size, icon_height, text_message, time_out, set_visible){

    const custom_element_args_values = [...arguments].slice(1) // remove 'selectedElement' from the 'custom_element_args_values' list.
    const custom_element_args_names = ['icon-url', 'background-color', 'color', 'font-size', 'icon-height', 'text-message', 'time-out', 'set-visible']

    custom_element_args_values.forEach((value, counter_index)=>{
        globalWindow.setAttribute(custom_element_args_names[counter_index], value)
    })


    // clear window for next message by changing all attributes.
    setTimeout(()=>{
        const clear_custom_element_args_values = ['', 'rgba(0,0,0,0)', '', '', '', '', '100', '']
        clear_custom_element_args_values.forEach((value, counter_index)=>{
            globalWindow.setAttribute(custom_element_args_names[counter_index], value)
        })
    }, +time_out+500)


}


/**
 * Success instance of 'global_information_window_update_attributes' used on successful ID validation.
 *
 * @param  {Element} globalWindow       : The global information window object grabbed with w$('#ID').
 *
 * @return {void}
 *
 */
export function global_information_window_log_in_success_generic(globalWindow){
    global_information_window_update_attributes(globalWindow, 'https://static.wixstatic.com/media/fdb700_223d6f8e60f849b78ffafce108b4868f~mv2.png',
        '#7AC142', 'white', '2em', '2em', 'Willkommen zurück!', '3000', 'true')
}

export function global_information_window_log_in_success_victron(globalWindow){
    global_information_window_update_attributes(globalWindow, 'https://static.wixstatic.com/media/fdb700_223d6f8e60f849b78ffafce108b4868f~mv2.png',
        '#7AC142', 'white', '2em', '2em', 'Willkommen zurück! Während Sie arbeiten, verfeinern wir den Terminkalender, ' +
        ' um nur Tage mit zuverlässigen Daten anzuzeigen.', '7000', 'true')
}

export function global_information_window_new_installation_chosen(globalWindow){
    global_information_window_update_attributes(globalWindow, 'https://static.wixstatic.com/media/fdb700_80876ac53eb64b348957dd0a6299d183~mv2.png',
        '#589BFF', 'white', '2em', '2em', 'Sie haben eine andere Installation ausgewählt. Wir suchen und merken uns Tage' +
        ' mit relevanten Daten im Terminkalender.', '7000', 'true')
}

/**
 * Failure instance of 'global_information_window_update_attributes' used on erroneous ID validation.
 *
 * @param  {Element} globalWindow       : The global information window object grabbed with w$('#ID').
 *
 * @return {void}
 *
 */
export function global_information_window_log_in_failure(globalWindow){
    global_information_window_update_attributes(globalWindow,'https://static.wixstatic.com/media/fdb700_4570bf376b024aefb326d2eb260593d7~mv2.png',
        '#FF0000','white', '2em', '2em','Zu dieser ID sind keine Daten hinterlegt', '3000','true')
}



/**
 * Shows and fades out the specified 'checkmarkInstance'. 'checkmarkInstance' is grabbed by $w(`#CheckmarkHTML${int}`), where int is some number id-ing the
 * custom checkmark html element.
 *
 * @param  {Element} checkmarkInstance      : The checkmark instance to show and reveal.
 *
 * @return {void}
 *
 */
export function checkmark(checkmarkInstance){
    checkmarkInstance.postMessage(["Reveal and Vanish"])
}

/**
 * Shows and fades out the specified 'checkmarkInstance'. 'checkmarkInstance' is grabbed by  $w(`#CrossmarkHTML${int}`), where int is some number id-ing the
 * custom checkmark html element.
 *
 * @param  {Element} crossmarkInstance      : The crossmark instance to show and reveal.
 *
 * @return {void}
 *
 */
export function crossmark(crossmarkInstance){
    crossmarkInstance.postMessage(["Reveal and Vanish"])
}

/**
 * Shows a custom html loader. Instance is grabbed by $w(`#LoadingDots${int}`), where int is some number id-ing the custom html loader element.
 *
 * @param  {Element} loaderInstance      : The loader instance to show.
 *
 * @return {void}
 *
 */
export function show_loader(loaderInstance){
    loaderInstance.show()
}

/**
 * Hides a custom html loader. Instance is grabbed by $w(`#LoadingDots${int}`), where int is some number id-ing the custom html loader element.
 *
 * @param  {Element} loaderInstance      : The loader instance to hide.
 *
 * @return {void}
 *
 */
export function hide_loader(loaderInstance){
    loaderInstance.hide()
}


/**
 * Changes the graph style of the supplied ChartJs instance to point.
 *
 * @param  {Element} chartJsInstance      : The chart.js instance manipulate. e.g. '$w("#ChartJsDaily")'
 *
 * @return {void}
 *
 */
export function change_graph_style_to_point(chartJsInstance){
    chartJsInstance.postMessage(["ChangeToPointStyle"])
}

/**
 * Changes the graph style of the supplied ChartJs instance to bar.
 *
 * @param  {Element} chartJsInstance      : The chart.js instance manipulate. e.g. '$w("#ChartJsDaily")'
 *
 * @return {void}
 *
 */
export function change_graph_style_to_bar(chartJsInstance){
    chartJsInstance.postMessage(["ChangeToBarStyle"])
}


/**
 * Trivial.
 *
 * @param  {Element} energyControlResult                                : E.g. $w("#EnergieKontrollErgebnis")
 * @param  {Element} deviationOfNumericalIntegralFromControlResult      : E.g. $w("#AbweichungDesIntegrals")
 * @param  {Element} roots                                              : E.g. $w("#Nullstellen")
 * @param  {Element} fitIntervalLimits                                  : E.g. $w("#GrenzenFitintervall"
 *
 * @return {void}
 *
 */
export function reset_results_from_fit_and_hide_texts(energyControlResult,deviationOfNumericalIntegralFromControlResult,roots,fitIntervalLimits){
    energyControlResult.text = "."
    deviationOfNumericalIntegralFromControlResult.text = "."
    roots.text = "."
    fitIntervalLimits.text = "."

    // hide the text fields that are filled with information once the python server responds with the fit information
    energyControlResult.hide()
    deviationOfNumericalIntegralFromControlResult.hide()
    roots.hide()
    fitIntervalLimits.hide()
}

/**
 * Lets the text boxes displaying the results from the fitting reappear.
 *
 * @param  {Element} energyControlResult                                : E.g. $w("#EnergieKontrollErgebnis")
 * @param  {Element} deviationOfNumericalIntegralFromControlResult      : E.g. $w("#AbweichungDesIntegrals")
 * @param  {Element} roots                                              : E.g. $w("#Nullstellen")
 * @param  {Element} fitIntervalLimits                                  : E.g. $w("#GrenzenFitintervall"
 *
 * @return {void}
 *
 */
export function initialize_fit_results_texts(energyControlResult, deviationOfNumericalIntegralFromControlResult,roots,fitIntervalLimits){
    energyControlResult.text = "."
    deviationOfNumericalIntegralFromControlResult.text = "."
    roots.text = "."
    fitIntervalLimits.text = "."
}

/**
 * Enables the user to choose settings for a polynomial function fit for consumption data.
 *
 * @param  {Element} polynomialSliderConsumption                            : E.g.  $w("#PolynomgradSliderVerbrauch")
 * @param  {Element} polynomialSliderConsumptionText                        : E.g. $w("#VerbrauchPolynomGradSliderBegleitText")
 * @param  {Element} tooltipTrigger                                         : E.g. $w("#TooltipTrigger2")
 * @param  {Element} htmlDisplayingConsumptionFitFunction                   : E.g. $w("#functionConsumptionFitTextHTML")
 * @param {Element}  htmlDisplayingConsumptionFitFunctionOnlyParameters     : E.g. $w("#ParameterConsumptionCodeHTML")
 * @param {Element}  latexImageConsumption                                  : E.g. $w("#functionLatexImageConsumption")
 *
 * @return {void}
 *
 */
export function show_consumption_fit_dials(polynomialSliderConsumption, polynomialSliderConsumptionText, tooltipTrigger,htmlDisplayingConsumptionFitFunction, htmlDisplayingConsumptionFitFunctionOnlyParameters, latexImageConsumption){
    polynomialSliderConsumption.show()
    polynomialSliderConsumptionText.show()
    tooltipTrigger.show()
    htmlDisplayingConsumptionFitFunction.show()
    htmlDisplayingConsumptionFitFunctionOnlyParameters.show()
    latexImageConsumption.show()
}

/**
 * Does the exact opposite as 'show_consumption_fit_dials'.
 *
 * @param  {Element} polynomialSliderConsumption                            : E.g.  $w("#PolynomgradSliderVerbrauch")
 * @param  {Element} polynomialSliderConsumptionText                        : E.g. $w("#VerbrauchPolynomGradSliderBegleitText")
 * @param  {Element} tooltipTrigger                                         : E.g. $w("#TooltipTrigger2")
 * @param  {Element} htmlDisplayingConsumptionFitFunction                   : E.g. $w("#functionConsumptionFitTextHTML")
 * @param {Element}  htmlDisplayingConsumptionFitFunctionOnlyParameters     : E.g. $w("#ParameterConsumptionCodeHTML")
 * @param {Element}  latexImageConsumption                                  : E.g. $w("#functionLatexImageConsumption")
 *
 * @return {void}
 *
 */
export function hide_consumption_fit_dials(polynomialSliderConsumption, polynomialSliderConsumptionText, tooltipTrigger,htmlDisplayingConsumptionFitFunction, htmlDisplayingConsumptionFitFunctionOnlyParameters, latexImageConsumption){
    polynomialSliderConsumption.hide()
    polynomialSliderConsumptionText.hide()
    tooltipTrigger.hide()
    htmlDisplayingConsumptionFitFunction.hide()
    htmlDisplayingConsumptionFitFunctionOnlyParameters.hide()
    latexImageConsumption.hide()
}

/**
 * Clear all pre-existing information from the result section and any function fits inside the chart js instance.
 *
 * @param  {Element} functionFitGenerationTextHtml                            : E.g.  $w("#functionFitTextHTML")
 * @param  {Element} functionFitConsumptionTextHtml                        : E.g. $w("#functionConsumptionFitTextHTML")
 * @param  {Element} parameterGenerationCodeHtml                                         : E.g. $w("#ParameterGenCodeHTML")
 * @param  {Element} parameterConsumptionCodeHtml                   : E.g. $w("#ParameterGenCodeHTML")
 * @param {Element}  chartJsInstance     : E.g. $w("#ChartJsDaily")
 *
 * @return {void}
 *
 */
export function wipe_interface_clean(functionFitGenerationTextHtml, functionFitConsumptionTextHtml, parameterGenerationCodeHtml, parameterConsumptionCodeHtml,chartJsInstance){
    functionFitGenerationTextHtml.postMessage(["Clear pre existing information!"])
    functionFitConsumptionTextHtml.postMessage(["Clear pre existing information!"])
    parameterGenerationCodeHtml.postMessage(["Clear pre existing information!"])
    parameterConsumptionCodeHtml.postMessage(["Clear pre existing information!"])
    chartJsInstance.postMessage(["Please clear any existing fits."])
}


/**
 * Hide weekly settings.
 *
 * @param  {Element} columnStripGenerationWeekly                         : E.g. $w("#ColumnStripGenerationWeekly")
 * @param  {Element} columnStripConsumptionWeekly                        : E.g. $w("#ColumnStripConsumptionWeekly")
 * @param  {Element} columnStripGenerationDaily                          : E.g. $w("#ColumnStripGenerationDaily")
 * @param  {Element} columnStripConsumptionDaily                         : E.g. $w("#ColumnStripConsumptionDaily")
 *
 * @return {void}
 *
 */
export function hide_weekly_dials_show_daily_dials(columnStripGenerationWeekly, columnStripConsumptionWeekly, columnStripGenerationDaily, columnStripConsumptionDaily){
    columnStripGenerationWeekly.collapse()
    columnStripConsumptionWeekly.collapse()

    columnStripGenerationDaily.expand()
    columnStripConsumptionDaily.expand()
}

/**
 * Hide daily settings.
 *
 * @param  {Element} columnStripGenerationWeekly                         : E.g. $w("#ColumnStripGenerationWeekly")
 * @param  {Element} columnStripConsumptionWeekly                        : E.g. $w("#ColumnStripConsumptionWeekly")
 * @param  {Element} columnStripGenerationDaily                          : E.g. $w("#ColumnStripGenerationDaily")
 * @param  {Element} columnStripConsumptionDaily                         : E.g. $w("#ColumnStripConsumptionDaily")
 *
 * @return {void}
 *
 */
export function hide_daily_dials_show_weekly_dials(columnStripGenerationWeekly, columnStripConsumptionWeekly, columnStripGenerationDaily, columnStripConsumptionDaily){
    columnStripGenerationWeekly.expand()
    columnStripConsumptionWeekly.expand()

    columnStripGenerationDaily.collapse()
    columnStripConsumptionDaily.collapse()
}







/**

                D A T A   M A N I P U L A T I O N   F U N C T I O N S
 */


export function add_standard_consumption_profile(){
    $w("#ChartJsDaily").postMessage(["AddStandartConsumptionProfile!"])
}

export function remove_standard_consumption_profile(){
    $w("#ChartJsDaily").postMessage(["RemoveStandartConsumptionProfile!"])
}

