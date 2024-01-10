import {
    checkmark,
    global_information_window_log_in_success_generic,
    hide_loader
} from "../graphs-element-manipulation-functions";

export function InitializeWorkspace_UKMongoDBSolution_Daily(GlobalInformationWindow, RadioGroupInstallations, DailyDatePicker, NameOfSchoolText, DailyChartJSInstance) {

    global_information_window_log_in_success_generic(GlobalInformationWindow)
    hide_loader($w('#LoadingDots1'))
    checkmark($w('#CheckmarkHTML1'))

}