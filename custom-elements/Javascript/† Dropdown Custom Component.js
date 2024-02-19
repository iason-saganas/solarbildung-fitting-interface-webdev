
/*

            C U S T O M    D R O P D O W N   E L E M E N T
            A custom dropdown element. Generates necessary HTML and Javascript and registers the element
            by extending the 'HTMLClass'. A default image acts as a 'button-face'. On click the dropdown menu
            opens. On hover and onclick on a choice the image source is changed to a with the choice associated
            image. On hover on the default 'button-face', if the 'tooltip_text' attribute is specified, a tooltip
            is shown that explains the functionality of the dropdown element.
*/

const all = ['HTML_createBaseWrappers', 'HTML_createDropdownMenuDivs', 'JS_AddEventClickListenerDropdownChoices',
    'JS_DispatchCustomEvent_TriggerWixVelo', 'JS_handleImageSourceChangeOnMouseIn', 'JS_handleImageSourceChangeOnMouseOut',
    'JS_HandleOnClickCloseMenuDiv', 'JS_CloseDropdownIfClickOnlyOnBody', 'JS_handleClick', 'JS_addClickListenerToDropdownImage',
    'JS_InsertDefaultImageIntoDropdownTrigger', 'createDOM', 'HTML_createTooltipDOM', 'JS_addHoverTooltip'
]

/*

            R E F E R E N C E    O F    I M A G E S
            for your convenience, the URLs of static images hosted by wix to be used as tool-icons.
*/

const reference_dict = {
    daily_calendar_icon: 'https://static.wixstatic.com/media/fdb700_f419ae4b95d747e290971ab5a11aa040~mv2.png',
    weekly_calendar_icon: 'https://static.wixstatic.com/media/fdb700_2bb5b56aba6142ccadd1a2621407f971~mv2.png',
    bar_graph_icon: 'https://static.wixstatic.com/media/fdb700_a83dd61d7f3046e7b15ddbecda36cb14~mv2.png',
    point_graph_icon: 'https://static.wixstatic.com/media/fdb700_edc74fb8bfb041968d708dc044a63cd8~mv2.png',
    run_script_icon: 'https://static.wixstatic.com/media/fdb700_ced5f7a2984242a194fab32e0d1ad725~mv2.png',
    run_script_hover_icon: 'https://static.wixstatic.com/media/fdb700_b0a6865e3ddb4bf9a0cb27c93ef316be~mv2.png',
    run_script_deactivated_icon: 'https://static.wixstatic.com/media/fdb700_9e2d5db2c0774053970c0eadbcb83af3~mv2.png',
    copy_to_clipboard_icon_generation_parameters: 'https://static.wixstatic.com/media/fdb700_235af0a9a0ee446fa7c7df5cb10974da~mv2.png',
    copy_to_clipboard_icon_consumption_parameters: 'https://static.wixstatic.com/media/fdb700_f779d9b6391845b4a84990baeb1b2470~mv2.png',
    copy_to_clipboard_deactivated_icon: 'https://static.wixstatic.com/media/fdb700_292590d627c048b7be455804d279af7d~mv2.png',
    copy_to_clipboard_icon_geogebra_code: 'https://static.wixstatic.com/media/fdb700_3453c0512e6649f4a980db036de03667~mv2.png',
    export_csv_data_icon: 'https://static.wixstatic.com/media/fdb700_9ca0922945ba4311a4cf131582f27971~mv2.png',
    export_png_data_icon: 'https://static.wixstatic.com/media/fdb700_63b00a7d67b9490a92f74e28d606d1e3~mv2.png',
    clear_all_icon: 'https://static.wixstatic.com/media/fdb700_234beb62eceb46b8a37d9d0d839e05c6~mv2.png',
    clear_all_hover_icon: 'https://static.wixstatic.com/media/fdb700_9a02bc67be7e4d5a8d59fb939378926c~mv2.png',
    clear_all_deactivated_icon: 'https://static.wixstatic.com/media/fdb700_605407391a2041cfbbe6e554c1730e00~mv2.png',
}

/*

            A T T R I B U T E S    T O    B E    S E T
            - 'options_list'            {string}    A string consisting of all dropdown choices, seperated by commas.
            - 'base_ID'                 {string}    A string representing the base ID, i.e. a string that is used to identify the 'custom-drop-down' div. It is also prepended to
                                                    each of the dropdown elements ID strings.
            - 'urls_list'               {string}    A string consisting of all URLs associated with each dropdown-choice, seperated by commas.
            - 'index_of_default_choice' {string}    A string representing the index of the default selected choice (e.g. '0' for the first choice).
            - 'tooltip_text'            {string}    The text that appears on hover of the tool, describing its functionality.
            - 'deactivated'             {string}    A string representing a boolean value ('true' or 'false') that indicates whether the element is active or not.
            - 'deactivated_media_url'   {string}    A string that contains the url of the media to be shown if deactivated==='true'.
            - 'deactivated_tooltip_text' {string}   A string that describes what to do in order to activate the element.

            Exemplary attribute collection:

            options_list = ' "Tagesübersicht", "Wochenübersicht" '
            base_ID = 'calendar-mode-dropdown'
            urls_list = ' "https://picsum.photos/200", "https://picsum.photos/300" '
            index_of_default_choice = '0'
            tooltip_text = 'Choose between daily data display or weekly aggregates.'
            deactivated = 'false'
            deactivated_media_url = ''
            deactivated_tooltip_text = ''
*/


/*

            D E F I N I T I O N    O F    C S S
*/

const STYLE = `.Custom-Dropdown {
        border-bottom: 0.5px solid gray;
        align-items: center;
        background-color: rgba(0,0,0,0.2);
        color: white;
        cursor: pointer;
        direction: ltr;
        display: flex;
        flex-wrap: nowrap;
        height: 1.3em;
        justify-content: start;
        padding: 6px 10px 6px 10px;
        transition: all .5s ease;
        transition-property: background-color;
        font-family: 'Roboto', sans-serif;
    }

    #Outer-Image-Wrapper{
        width:max-content;
    }

    .Dropdown-Menu-Image{
        cursor:pointer;
        height: 6em;
    }

    .Dropdown-Options-Wrapper{
        z-index: 10;
        visibility: hidden;
        position: absolute;
    }

    .Custom-Dropdown-Close-Window{
        background-color: rgba(0,0,0,0.6);
    }
    
    .Tooltip{
        background-color: rgba(0,0,0,0.6);
        color: white;
        font-family: 'Roboto', sans-serif;
        border-radius: 5px;
        padding: 5px 5px 5px 5px;
        width: 100px;
        position: absolute;
        visibility: hidden;
        word-wrap: break-word;
        white-space: pre-wrap;
        word-break: break-word;
        
        
    }

    /*     H O V E R    S T Y L E S    A N D    P S E U D O    S E L E C T O R S    */


    .Custom-Dropdown:hover {
        background-color: rgba(0,0,0,0.4);
    }

    .Custom-Dropdown-Close-Window:hover{
        background-color: rgba(0,0,0,0.6);
    }

    .Close-Button:after{
        display: inline-block;
        content: "\\00d7"; /* This will render the 'X' */
        font-size: 2em;
        cursor: pointer;
    }

    .Close-Button:hover{
        color: rgb(236, 95, 91);
    }
`;


const green = 'rgb(0,229,0)'

/*

            H E L P E R    F U N C T I O N S
*/

/**
 * Creates the HTML base wrappers that are filled with content and manipulated
 * programmatically subsequently. It is the first function that needs to be called
 * in the 'createDOM' function lifecycle.
 *
 * @param   {string}    base_ID           The string that is prepended to the ID's of each dropdown option. Something like 'weekly-choices'.
 * @param   {string}    PictureURL        Τhe URL of the default media to be displayed as the button icon.
 *
 * @return {void}
 *
 * */
function HTML_createBaseWrappers(base_ID, PictureURL){
    const outer_image_wrapper = document.createElement('div')
    outer_image_wrapper.setAttribute('id', 'Outer-Image-Wrapper')

    const dropdown_options_wrapper = document.createElement('div')
    dropdown_options_wrapper.classList.add('Dropdown-Options-Wrapper')
    dropdown_options_wrapper.id = `${base_ID}-Dropdown-Options-Wrapper`

    const image = document.createElement('img')
    image.classList.add('Dropdown-Menu-Image')
    image.id = `${base_ID}-Dropdown-Menu-Image`
    image.setAttribute('alt', 'Tool-Icon')
    image.setAttribute('src', PictureURL)

    outer_image_wrapper.appendChild(image)

    let custom_element_instance = document.getElementById(base_ID)

    custom_element_instance.appendChild(outer_image_wrapper)
    custom_element_instance.appendChild(dropdown_options_wrapper)

}

/**
 * Targets the 'outer_dropdown_wrapper' variable and programmatically adds all dropdown options
 * given by 'list_of_choices', as well as a "close menu option" as the first div.
 * Adds on hover event listeners, that change the displayed media depending on the selection.
 *
 * @param {string[]}    list_of_choices             Τhe URL of the default media to be displayed as the button icon.
 * @param {string}      base_ID                     A string that is prepended to the ID's of each dropdown option. Something like 'weekly-choices'.
 * @param {number}      index_of_default_element    A number that indicates the index of the default selected element. E.g. 0 for 'option_1'.
 * @param {string[]}         list_of_image_urls          A list that contains URLs to different media associated with the different dropdown options.
 *                                                  Each respective media will be displayed on hover and after selection.
 *
 * @return  {void}
 * */
function HTML_createDropdownMenuDivs(list_of_choices,base_ID, index_of_default_element, list_of_image_urls){

    let outer_dropdown_wrapper = document.getElementById(`${base_ID}-Dropdown-Options-Wrapper`)

    // the very first option in the dropdown menu should be a 'close this window' option
    let close_menu_div = document.createElement('div')
    let close_menu_cross = document.createElement('div')
    close_menu_cross.classList.add('Close-Button')
    close_menu_cross.setAttribute('id',`${base_ID}-close-button`)

    close_menu_div.classList.add('Custom-Dropdown', 'Custom-Dropdown-Close-Window')
    close_menu_div.appendChild(close_menu_cross)

    outer_dropdown_wrapper.appendChild(close_menu_div)


    // for all options given in 'list_of_choices', create a div of class 'Custom-Dropdown' and bestow it
    // with text. Using 'array.forEach' instead of looping with 'for const of...' because latter is
    // bad practice and the 'forEach' method returns the counter index as well.

    list_of_choices.forEach(function (option, counter_index) {


        // create text and div, add 'Custom-Dropdown' class and append to outer wrapper
        let div_text = document.createTextNode(option)
        let new_div = document.createElement('div')
        new_div.appendChild(div_text)
        new_div.classList.add('Custom-Dropdown', `${base_ID}-Option`)
        outer_dropdown_wrapper.appendChild(new_div)

        // if the 'choice_${counter_index}' is equal to 'index_of_default_element', add additional style to indicate that this is the currently selected
        // element.

        if (counter_index === index_of_default_element){
            new_div.style.borderBottom = `1px solid ${green}`
        }

        // give the dropdown an ID based on the counter and base ID
        new_div.setAttribute('id', `${base_ID}-${counter_index}`)

        // change the image source depending onhover on the div
        const currently_used_image = list_of_image_urls[index_of_default_element]
        new_div.onmouseenter = ()=> JS_handleImageSourceChangeOnMouseIn(list_of_image_urls[counter_index], base_ID)
        new_div.onmouseout = () => JS_handleImageSourceChangeOnMouseOut(base_ID)

    })
}

/**
 * To each 'new_div' dropdown-option, add a click event handler and specify style changes on selection of option.
 *
 * @param {string[]}     list_of_image_urls         A list that contains URLs to different media associated with the different dropdown options.
 *                                                  Each respective media will be displayed on click, i.e. on selection.
 * @param {string}     base_ID                      The base ID that is used to identify the whole custom element.
 *
 * @return  {void}
 * */
function JS_AddEventClickListenerDropdownChoices(list_of_image_urls,base_ID){
    // Finally, add a click event listener, that changes the style to indicate selection and alters the global variable 'index_of_currently_selected_element'.
    let all_dropdown_options = document.getElementsByClassName(`${base_ID}-Option`)
    let all_dropdown_options_array = [...all_dropdown_options]
    let length = all_dropdown_options_array.length
    // convert the 'HTMLCollection' into an Object via the spread operator in order to use the '.forEach()' method on it
    all_dropdown_options_array.forEach(function (dropdown_div, counter_index){
        dropdown_div.addEventListener('click', event => {
            // green border for the selected element.
            dropdown_div.style.borderBottom = `1px solid ${green}`
            dropdown_div.style.backgroundColor = 'rgba(0,0,0,0.4)'
            const index_of_currently_selected_element = counter_index
            const currently_used_image = list_of_image_urls[counter_index] // option was selected, update global variable 'currently_used_image'

            // change the image to corresponding selected element
            let image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
            image.src = currently_used_image
            image.currentlyUsedImage = currently_used_image // define a new attribute that can be grabbed by the onmouseout function

            // SEND MESSAGE TO WIX VELO WITH UPDATE ON SELECTION
            JS_DispatchCustomEvent_TriggerWixVelo(index_of_currently_selected_element, base_ID)

            // alert(index_of_currently_selected_element) or rather window.parent.postMessage('index_of_currently_selected_element', index_of_currently_selected_element) . . .

            // For all other elements, set the border to none, indicating that option is not active
            let i = 0
            while ( i < length ){
                if ( i !== index_of_currently_selected_element){
                    all_dropdown_options_array[i].style.border = '0px'
                    all_dropdown_options_array[i].style.backgroundColor = 'rgba(0,0,0,0.2)'
                }
                i++
            }
        })
    })
}


/**
 * A custom event dispatched in the 'JS_AddEventClickListenerDropdownChoices' function when an element is selected.
 * When triggered, the index of the currently selected element is gotten on the WIX-Velo side.
 * The custom event's name is 'DropdownChoice'.
 *
 * @param {number}     currentlySelectedIndex   The index of the currently selected choice. E.g. 0 for 'choice_1'.
 * @param {string}     base_ID                  The base ID that is used to identify the whole custom element.
 *
 * @return  {void}
 * */
function JS_DispatchCustomEvent_TriggerWixVelo(currentlySelectedIndex, base_ID){
    const dropdown_custom_element = document.getElementById(base_ID)
    const dispatch_event_information = {detail: currentlySelectedIndex}
    const custom_event = new CustomEvent('DropdownChoice', dispatch_event_information)

    dropdown_custom_element.dispatchEvent(custom_event)

}

/**
 * The function associated with the 'onmouseover' action of the dropdown options. Changes the image
 * source to the function argument. Used in function 'HTML_createDropdownMenuDivs'
 *
 * @param {string}      ImageURLToChangeTo  Τhe URL of the image to be displayed on mouse in.
 * @param {string}      base_ID             Used as universal locator of the custom dropdown element.
 *
 * @return  {void}
 * */
function JS_handleImageSourceChangeOnMouseIn(ImageURLToChangeTo, base_ID){
    let image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
    image.src = ImageURLToChangeTo
}

/**
 * The function associated with the 'onmouseout' action of the dropdown options. Changes the image
 * source to the currently in-use picture URL if no new selection is made. Used in function 'HTML_createDropdownMenuDivs'.
 * If new selection is made, behaviour is specified in function 'JS_AddEventClickListenerDropdownChoices'
 *
 * @param {string}  base_ID                 Used as universal locator of the custom dropdown element.
 *
 * @return  {void}
 * */
function JS_handleImageSourceChangeOnMouseOut(base_ID){
    let image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
    currently_used_image = image.currentlyUsedImage
    image.src = currently_used_image
}

/**
 * Close the 'dropdown_options_wrapper' by setting its visibility style to 'hidden' when the 'close_menu_cross'
 * is clicked.
 *
 * @param {string} base_ID      The string that was prepended to each dropdown-menu option that is uesed to fetch the
 *                              'close_menu' div of the 'dropdown_options_wrapper'.
 *
 * @return  {void}
 * */
function JS_HandleOnClickCloseMenuDiv(base_ID){
    // if the 'close-menu' button is clicked, set visibility of 'dropdown_options_wrapper' to hidden.
    let close_menu_cross = document.getElementById(`${base_ID}-close-button`)
    let dropdown_options_wrapper = document.getElementById(`${base_ID}-Dropdown-Options-Wrapper`)
    close_menu_cross.addEventListener('click', event => {dropdown_options_wrapper.style.visibility='hidden'})

}


/**
 * Does the same as 'JS_HandleOnClickCloseMenuDiv': Closes the 'dropdown_options_wrapper' not when the 'close_menu_cross' element is clicked,
 * but rather if a click is registered on the body anywhere else than the 'dropdown_menu_image' or 'dropdown_options_wrapper' itself.
 *
 * @param {string} base_ID      Used as universal locator of the custom dropdown element.
 *
 * @return  {void}
 * */
function JS_CloseDropdownIfClickOnlyOnBody(base_ID){
    // if a click is registered anywhere on the body except for the image wrapper or the dropdown menu, hide the dropdown menu.
    let dropdown_menu_image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
    let body = document.getElementsByTagName('body')[0]
    let dropdown_options_wrapper = document.getElementById(`${base_ID}-Dropdown-Options-Wrapper`)
    body.addEventListener('click', event => {
        let target = event.target
        let target_class_list = [...target.classList]
        if (target !== dropdown_menu_image && !target_class_list.includes(`${base_ID}-Option`)){
            dropdown_options_wrapper.style.visibility = 'hidden'
        }
    })
}

/**
 * The function associated with the click event listener on the 'dropdown_menu_image' element.
 * Sets the visibility of the 'dropdown_options_wrapper' to 'visible' and positions it absolutely
 * in the vicinity of 'dropdown_menu_image'. Is used in function 'JS_addClickListenerToDropdownImage'.
 *
 * @param {MouseEvent}  event        The event object associated with the click.
 * @param {string}      base_ID      Used as universal locator of the custom dropdown element.
 *
 * @return {void}
 *
 * */
function JS_handleClick(event,base_ID){

    let outer_dropdown_wrapper = document.getElementById(`${base_ID}-Dropdown-Options-Wrapper`)
    let dropdown_menu_image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)

    // adjust the position of the outer wrapper programmatically
    let x_position = dropdown_menu_image.getBoundingClientRect().width/2-outer_dropdown_wrapper.getBoundingClientRect().width/2
    let y_position = 6.5 // dropdown_menu_image.getBoundingClientRect().bottom-10

    outer_dropdown_wrapper.style.position = 'absolute'
    outer_dropdown_wrapper.style.left = x_position+'px'
    outer_dropdown_wrapper.style.top = y_position+'em'
    outer_dropdown_wrapper.style.visibility = 'visible'

}

/**
 * Adds a click event listener to the 'dropdown_menu_image' element that "opens" up
 * the dropdown options.
 *
 * @param {string} base_ID      Used as universal locator of the custom dropdown element.
 *
 * @return {void}
 *
 * */
function JS_addClickListenerToDropdownImage(base_ID){
    let dropdown_menu_image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
    dropdown_menu_image.addEventListener('click', event =>  JS_handleClick(event, base_ID))
}

/**
 * Replace the "lorem picsum" fallback-image of the 'dropdown_menu_image' element with the default image provided
 * by the user.
 *
 * @param   {string}    default_url     The URL representing the image of the default selected option. An element of the
 *                                      user-input 'list_of_image_urls', which in return is collected via WIX Velo attribute
 *                                      setting of the custom element.
 * @param {string} base_ID      Used as universal locator of the custom dropdown element.
 *
 * @return  {void}
 *
 * */
function JS_InsertDefaultImageIntoDropdownTrigger(default_url, base_ID){
    let dropdown_menu_image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
    dropdown_menu_image.src = default_url
}


/**
 * Executes all helper functions.
 *
 * @param {(string)[]}     list_of_choices             Τhe URL of the default media to be displayed as the button icon.
 * @param {string}  base_ID                     A string that is prepended to the ID's of each dropdown option. Something like 'weekly-choices'.
 * @param {number}  index_of_default_element    A number that indicates the index of the default selected element. E.g. 0 for 'option_1'.
 * @param {(string)[]}     list_of_image_urls          A list that contains URLs to different media associated with the different dropdown options.
 *                                              Each respective media will be displayed on hover and after selection.
 *
 * @return {void}
 *
 **/
function createDOM(list_of_choices, base_ID, index_of_default_element, list_of_image_urls){

    let default_image = list_of_image_urls[index_of_default_element]

    currently_used_image = default_image

    HTML_createBaseWrappers(base_ID,'https://picsum.photos/200/300')
    HTML_createDropdownMenuDivs(list_of_choices, base_ID, index_of_default_element, list_of_image_urls)
    JS_HandleOnClickCloseMenuDiv(base_ID)
    JS_CloseDropdownIfClickOnlyOnBody(base_ID)
    JS_AddEventClickListenerDropdownChoices(list_of_image_urls, base_ID)
    JS_InsertDefaultImageIntoDropdownTrigger(default_image, base_ID)
}

/**
 * The function that creates the DOM of the tooltip, if tooltip text is provided as attribute of custom element.
 *
 * @param {string}  tooltip_text             Τhe to be displayed text content of the tooltip
 * @param {string}  base_ID                  The base ID that is used to identify the whole custom element.
 *
 *
 * @return {void}
 *
 **/
function HTML_createTooltipDOM(tooltip_text, base_ID){
    const tooltip_div = document.createElement('div')
    tooltip_div.classList.add('Tooltip')
    tooltip_div.id = `${base_ID}-tooltip`
    tooltip_div.textContent = tooltip_text

    let custom_element_instance = document.getElementById(base_ID)
    custom_element_instance.appendChild(tooltip_div)

    let dropdown_menu_image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
    // adjust the position of the outer wrapper programmatically
    let x_position = dropdown_menu_image.getBoundingClientRect().width/2-tooltip_div.getBoundingClientRect().width/2
    let y_position = 7 // dropdown_menu_image.getBoundingClientRect().bottom-10

    tooltip_div.style.position = 'absolute'
    tooltip_div.style.left = x_position+'px'
    tooltip_div.style.bottom = y_position+'em'
}

/**
 * Adds onmouseenter and onmouseout event to the dropdown image that shows/hides the tooltip.
 *
 * @param {string}  base_ID                  The base ID that is used to identify the whole custom element.
 *
 * @return {void}
 *
 **/
function JS_addHoverTooltip(base_ID){
    let dropdown_menu_image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
    let tooltip = document.getElementById(`${base_ID}-tooltip`)

    dropdown_menu_image.onmouseenter = function(){tooltip.style.visibility='visible'}
    dropdown_menu_image.onmouseout = function(){tooltip.style.visibility='hidden'}

}


/*

            C R E A T I N G    C U S T O M     E L E M E N T
*/


class DropdownCustomComponent extends HTMLElement {
    connectedCallback() {

        // create the css for the custom element
        const style = document.createElement('style');
        style.innerHTML = STYLE;
        this.appendChild(style);

        // These are the constants that set via attributes which are passed to the 'createDOM' function
        const list_of_options_to_chose_from = this.getAttribute('options_list').split(',') // turn the string into an array
        const base_ID = this.getAttribute('base_ID')
        const list_of_urls = this.getAttribute('urls_list').split(',')
        const index_of_default_selected_element = +this.getAttribute('index_of_default_choice')
        const tooltip_text = this.getAttribute('tooltip_text')
        const deactivated = this.getAttribute('deactivated')
        const deactivated_media = this.getAttribute('deactivated_media_url')
        const deactivated_tooltip_text = this.getAttribute('deactivated_tooltip_text')


        // give it the base_ID as ID. Used in the helper function to find the custom element since it
        // didn't work to give the 'this' keyword as an argument to those functions.
        this.id = base_ID
        this.default_image = list_of_urls[index_of_default_selected_element]
        this.standard_tooltip = tooltip_text

        createDOM(list_of_options_to_chose_from, base_ID, index_of_default_selected_element, list_of_urls)

        // set the currently used image as the default image in order for onmouseout to grab it (function 'JS_handleImageSourceChangeOnMouseOut')
        let image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
        image.currentlyUsedImage = list_of_urls[index_of_default_selected_element]


        if (deactivated === 'true'){
            // create the deactivated state tooltip text
            HTML_createTooltipDOM(deactivated_tooltip_text, base_ID)
            // change the image to the deactivated media url
            let imageToChange = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
            imageToChange.src = deactivated_media
        }
        else {
            // add click event listener to image that makes the dropdown choices visible
            JS_addClickListenerToDropdownImage(base_ID)
            // if 'tooltip_text' is not null, create the tooltip DOM and add hover listener to image
            HTML_createTooltipDOM(tooltip_text, base_ID)
        }
        JS_addHoverTooltip(base_ID)
    }

    static get observedAttributes() {
        return ['deactivated'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((name==='deactivated') && (newValue==='false')) {
            if (this.default_image){
                // only rund code after initialization.
                /*
                * icon is to be activated!
                * 1. Change image, tooltip text
                * 2. Add dropdown options and the ability to dispatch a custom click event
                */
                let imageToChange = document.getElementById(`${this.id}-Dropdown-Menu-Image`)
                let tooltipToChange = document.getElementById(`${this.id}-tooltip`)
                imageToChange.src = this.default_image
                tooltipToChange.textContent = this.standard_tooltip
                // add click event listener to image that makes the dropdown choices visible
                JS_addClickListenerToDropdownImage(this.id)
            }
        }
    }

}

customElements.define('custom-dropdown-component', DropdownCustomComponent);