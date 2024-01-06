import {
    checkmark,
    global_information_window_log_in_success,
    hide_loader
} from "../graphs-element-manipulation-functions";

export function InitializeWorkspace_UKMongoDBSolution_Daily(GlobalInformationWindow, RadioGroupInstallations, DailyDatePicker, NameOfSchoolText, DailyChartJSInstance) {

    global_information_window_log_in_success(GlobalInformationWindow)
    hide_loader($w('#LoadingDots1'))
    checkmark($w('#CheckmarkHTML1'))

}