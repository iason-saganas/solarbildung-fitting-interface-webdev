
/*

            C U S T O M    I C O N    B U T T O N
            A custom icon button element, mimicking the behaviour of Wix's built-in element
            'icon-button', but also a tooltip functionality is provided.
            Code is the same as in local file 'Dropdown Custom Component.js', but without
            the dropdown choices.
*/

const all = [
    'HTML_createOnlyImage', 'JS_IconButtonHover', 'JS_IconButtonWixVeloCommunication',
    'HTML_createTooltipDOM', 'JS_addHoverTooltip', 'JS_adjustImageToCustomHeight'
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
    run_script_icon: 'https://static.wixstatic.com/media/fdb700_2fdd340c51014662a137f88e294641c5~mv2.png',
    run_script_hover_icon: 'https://static.wixstatic.com/media/fdb700_9d0f437bbd73463293ef0ca8d2385eb1~mv2.png',
    copy_to_clipboard_icon_generation_parameters: 'https://static.wixstatic.com/media/fdb700_235af0a9a0ee446fa7c7df5cb10974da~mv2.png',
    copy_to_clipboard_icon_consumption_parameters: 'https://static.wixstatic.com/media/fdb700_f779d9b6391845b4a84990baeb1b2470~mv2.png',
    copy_to_clipboard_icon_geogebra_code: 'https://static.wixstatic.com/media/fdb700_3453c0512e6649f4a980db036de03667~mv2.png',
    export_csv_data_icon: 'https://static.wixstatic.com/media/fdb700_9ca0922945ba4311a4cf131582f27971~mv2.png',
    export_png_data_icon: 'https://static.wixstatic.com/media/fdb700_63b00a7d67b9490a92f74e28d606d1e3~mv2.png',
    clear_all_icon: 'https://static.wixstatic.com/media/fdb700_baa45e9c041a4d3cb8bf530cc59b322a~mv2.png',
    clear_all_hover_icon: 'https://static.wixstatic.com/media/fdb700_4de62e157c184bbfbae8437374c3e72d~mv2.png',
}

/*

            A T T R I B U T E S    T O    B E    S E T
            - 'base_ID'                 {string}    A string representing the base ID, i.e. a string that is used to identify the 'custom-drop-down' div. It is also prepended to
                                                    each of the dropdown elements ID strings.
            - 'urls_list'               {string}    A string consisting of two URLs: the first one the default image of the icon and the second one image to replace with on hover.
            - 'index_of_default_choice' {string}    A string representing the index of the default selected choice (e.g. '0' for the first choice).
            - 'tooltip_text'            {string}    The text that appears on hover of the tool, describing its functionality.
            - 'custom_height'           {string}    A custom height to adjust the icon button to.

            Exemplary attribute collection:

            base_ID = 'calendar-mode-dropdown'
            urls_list = ' "https://picsum.photos/200", "https://picsum.photos/300" '
            index_of_default_choice = '0'
            tooltip_text = 'Choose between daily data display or weekly aggregates.'
            custom_height = '50px'
*/


/*

            D E F I N I T I O N    O F    C S S
*/

const STYLE = `

    #Outer-Image-Wrapper{
        width:max-content;
    }

    .Dropdown-Menu-Image{
        cursor:pointer;
        height: 6em;
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

`;

/*

            G L O B A L    V A R I A B L E S    A N D    C O N S T A N T S
*/

const green = 'rgb(0,229,0)'

/*

            H E L P E R    F U N C T I O N S
*/


/**
 * Creates only the image HTML and corresponding wrappers. Used instead of 'createDOM' function (in 'Dropdown Custom Component.js'),
 * in case that only a custom icon button with tooltip wants to be created, not a dropdown menu.
 *
 * @param   {string}    base_ID           The string that is prepended to the ID's of each dropdown option. Something like 'weekly-choices'.
 * @param   {string}    defaultImageURL        Τhe URL of the default media to be displayed as the button icon.
 *
 * @return {void}
 *
 * */
function HTML_createOnlyImage(base_ID, defaultImageURL){
    const outer_image_wrapper = document.createElement('div')
    outer_image_wrapper.setAttribute('id', 'Outer-Image-Wrapper')

    const image = document.createElement('img')
    image.classList.add('Dropdown-Menu-Image')
    image.id = `${base_ID}-Dropdown-Menu-Image`
    image.setAttribute('alt', 'Tool-Icon')
    image.setAttribute('src', defaultImageURL)

    outer_image_wrapper.appendChild(image)

    let custom_element_instance = document.getElementById(base_ID)

    custom_element_instance.appendChild(outer_image_wrapper)
}

/**
 * Creates only the image HTML and corresponding wrappers. Used instead of 'createDOM' function (in 'Dropdown Custom Component.js'),
 * in case that only a custom icon button with tooltip wants to be created, not a dropdown menu.
 *
 * @param   {string}    base_ID           The string that is prepended to the ID's of each dropdown option. Something like 'weekly-choices'.
 * @param   {string}    hoverImageURL     Τhe URL of the media to be displayed onhover of the icon button.
 * @param   {string}    defaultImageURL     Τhe URL of the default media to be displayed onmouseout.
 *
 * @return {void}
 *
 * */
function JS_IconButtonHover(hoverImageURL, defaultImageURL, base_ID){
    let custom_element_instance = document.getElementById(base_ID)
    let image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)

    custom_element_instance.onmouseenter = function(){image.src = hoverImageURL}
    custom_element_instance.onmouseleave = function(){image.src = defaultImageURL}

}


/**
 * A custom event dispatched when the icon button custom element is clicked.
 * Communicates to Wix Velo that an event was triggered.
 * The custom event's name is 'IconButtonClick'.
 *
 * @param {string}     base_ID                  The base ID that is used to identify the whole custom element.
 *
 * @return  {void}
 * */
function JS_IconButtonWixVeloCommunication(base_ID){
    let custom_element_instance = document.getElementById(base_ID)
    const dispatch_event_information = {detail: true}
    const custom_event = new CustomEvent('IconButtonClick', dispatch_event_information)

    custom_element_instance.dispatchEvent(custom_event)

    custom_element_instance.addEventListener('click', event => custom_element_instance.dispatchEvent(custom_event))

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

/**
 * If attribute 'custom_height' is provided, this function is called and programmatically changes the height of the icon button.
 *
 * @param {string}  height                  The height string, e.g. '5em' or '50px'
 * @param {string}  base_ID                  The base ID that is used to identify the whole custom element.
 *
 * @return {void}
 *
 **/
function JS_adjustImageToCustomHeight(height,base_ID){
    let dropdown_menu_image = document.getElementById(`${base_ID}-Dropdown-Menu-Image`)
    dropdown_menu_image.style.height = height
}

/*

            C R E A T I N G    C U S T O M     E L E M E N T
*/


class IconButtonCustomComponent extends HTMLElement {
    connectedCallback() {

        // create the css for the custom element
        const style = document.createElement('style');
        style.innerHTML = STYLE;
        this.appendChild(style);

        // These are the constants that set via attributes which are passed to the 'createDOM' function
        const base_ID = this.getAttribute('base_ID')
        const list_of_urls = this.getAttribute('urls_list').split(',')
        const default_image = list_of_urls[0]
        const hover_image = list_of_urls[1]

        const index_of_default_selected_element = +this.getAttribute('index_of_default_choice')
        const tooltip_text = this.getAttribute('tooltip_text')

        const custom_height = this.getAttribute('custom_height')


        // give it the base_ID as ID. Used in the helper function to find the custom element since it
        // didn't work to give the 'this' keyword as an argument to those functions.
        this.id = base_ID

        HTML_createOnlyImage(base_ID, list_of_urls[index_of_default_selected_element])
        JS_IconButtonHover(hover_image,default_image,base_ID)
        JS_IconButtonWixVeloCommunication(base_ID)

        if (tooltip_text){
            // if 'tooltip_text' is not null, create the tooltip DOM and add hover listener to image
            HTML_createTooltipDOM(tooltip_text, base_ID)
            JS_addHoverTooltip(base_ID)
        }

        if (custom_height){
            JS_adjustImageToCustomHeight(custom_height, base_ID)
        }
    }}

customElements.define('icon-button-custom-component', IconButtonCustomComponent);