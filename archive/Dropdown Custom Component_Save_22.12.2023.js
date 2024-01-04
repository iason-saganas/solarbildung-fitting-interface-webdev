/*

            D E F I N I T I O N    O F    C S S
*/

const STYLE = `.Custom-Dropdown {
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
        background-color: rgba(0,0,0,0.6);
        width:max-content;
    }

    .Dropdown-Menu-Image{
        cursor:pointer;
    }

    #Dropdown-Options-Wrapper{
        visibility: hidden;
    }

    .Custom-Dropdown-Close-Window{
        background-color: rgba(0,0,0,0.6);
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

/*

            G L O B A L    V A R I A B L E S    A N D    C O N S T A N T S
*/

var index_of_currently_selected_element = 0
var currently_used_image = null

const green = 'rgb(0,229,0)'

/*

            H E L P E R    F U N C T I O N S
*/

/**
 * Creates the HTML base wrappers that are filled with content and manipulated
 * programmatically subsequently. It is the first function that needs to be called
 * in the 'createDOM' function lifecycle.
 *
 * @param   {string}    PictureURL        Τhe URL of the default media to be displayed as the button icon.
 *
 *  @return {void}
 *
 * */
function HTML_createBaseWrappers(PictureURL){
    const outer_image_wrapper = document.createElement('div')
    outer_image_wrapper.id = 'Outer-Image-Wrapper'

    const dropdown_options_wrapper = document.createElement('div')
    dropdown_options_wrapper.id = 'Dropdown-Options-Wrapper'

    const image = document.createElement('img')
    image.classList.add('Dropdown-Menu-Image')
    image.alt = 'Tool-Icon'
    image.src = PictureURL

    console.log("outer wrappa ", outer_image_wrapper)
    console.log("anotha wrappa ", dropdown_options_wrapper)

    let UltraTest = document.getElementById("submoon-choice")

    console.log("divving myself outta here ", UltraTest)

    outer_image_wrapper.appendChild(image)

    UltraTest.appendChild(dropdown_options_wrapper)
    UltraTest.appendChild(outer_image_wrapper)



}

/**
 * Targets the 'outer_dropdown_wrapper' variable and programmatically adds all dropdown options
 * given by 'list_of_choices', as well as a "close menu option" as the first div.
 * Adds on hover event listeners, that change the displayed media depending on the selection.
 *
 * @param {string[]}     list_of_choices             Τhe URL of the default media to be displayed as the button icon.
 * @param {string}  base_ID                     A string that is prepended to the ID's of each dropdown option. Something like 'weekly-choices'.
 * @param {number}  index_of_default_element    A number that indicates the index of the default selected element. E.g. 0 for 'option_1'.
 * @param {obj}     list_of_image_urls          A list that contains URLs to different media associated with the different dropdown options.
 *                                              Each respective media will be displayed on hover and after selection.
 *
 * @return  {void}
 * */
function HTML_createDropdownMenuDivs(list_of_choices,base_ID, index_of_default_element, list_of_image_urls){

    let outer_dropdown_wrapper = document.getElementById('Dropdown-Options-Wrapper')

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
        new_div.classList.add('Custom-Dropdown', 'Option')
        outer_dropdown_wrapper.appendChild(new_div)

        // if the 'choice_${counter_index}' is equal to 'index_of_default_element', add additional style to indicate that this is the currently selected
        // element.

        if (counter_index === index_of_default_element){
            new_div.style.borderBottom = `1px solid ${green}`
        }

        // give the dropdown an ID based on the counter and base ID
        new_div.setAttribute('id', `${base_ID}-${counter_index}`)

        // change the image source depending onhover on the div
        new_div.setAttribute('onmouseover', `JS_handleImageSourceChangeOnMouseIn('${list_of_image_urls[counter_index]}')`)
        new_div.setAttribute('onmouseout', 'JS_handleImageSourceChangeOnMouseOut()')

    })
}

/**
 * To each 'new_div' dropdown-option, add a click event handler and specify style changes on selection of option.
 *
 * @param {string[]}     list_of_image_urls          A list that contains URLs to different media associated with the different dropdown options.
 *                                              Each respective media will be displayed on click, i.e. on selection.
 *
 * @return  {void}
 * */
function JS_AddEventClickListenerDropdownChoices(list_of_image_urls){
    // Finally, add a click event listener, that changes the style to indicate selection and alters the global variable 'index_of_currently_selected_element'.
    let all_dropdown_options = document.getElementsByClassName('Option')
    let all_dropdown_options_array = [...all_dropdown_options]
    let length = all_dropdown_options_array.length
    // convert the 'HTMLCollection' into an Object via the spread operator in order to use the '.forEach()' method on it
    all_dropdown_options_array.forEach(function (dropdown_div, counter_index){
        dropdown_div.addEventListener('click', event => {
            // green border for the selected element.
            dropdown_div.style.borderBottom = `1px solid ${green}`
            dropdown_div.style.backgroundColor = 'rgba(0,0,0,0.4)'
            index_of_currently_selected_element = counter_index
            currently_used_image = list_of_image_urls[counter_index] // option was selected, update global variable 'currently_used_image'


            let image = document.getElementsByClassName("Dropdown-Menu-Image")[0]
            image.src = currently_used_image

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
 * The function associated with the 'onmouseover' action of the dropdown options. Changes the image
 * source to the function argument. Used in function 'HTML_createDropdownMenuDivs'
 *
 * @param {string}     ImageURLToChangeTo  Τhe URL of the image to be displayed on mouse in.
 *
 * @return  {void}
 * */
function JS_handleImageSourceChangeOnMouseIn(ImageURLToChangeTo){
    let image = document.getElementsByClassName("Dropdown-Menu-Image")[0]
    image.src = ImageURLToChangeTo
}

/**
 * The function associated with the 'onmouseout' action of the dropdown options. Changes the image
 * source to the currently in-use picture URL if no new selection is made. Used in function 'HTML_createDropdownMenuDivs'.
 * If new selection is made, behaviour is specified in function 'JS_AddEventClickListenerDropdownChoices'
 *
 * @return  {void}
 * */
function JS_handleImageSourceChangeOnMouseOut(){
    let image = document.getElementsByClassName("Dropdown-Menu-Image")[0]
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
    let dropdown_options_wrapper = document.getElementById('Dropdown-Options-Wrapper')
    close_menu_cross.addEventListener('click', event => {dropdown_options_wrapper.style.visibility='hidden'})

}


/**
 * Does the same as 'HandleOnClickCloseMenuDiv': Closes the 'dropdown_options_wrapper' not when the 'close_menu_cross' element is clicked,
 * but rather if a click is registered on the body anywhere else than the 'dropdown_menu_image' or 'dropdown_options_wrapper' itself.
 *
 * @return  {void}
 * */
function JS_CloseDropdownIfClickOnlyOnBody(){
    // if a click is registered anywhere on the body except for the image wrapper or the dropdown menu, hide the dropdown menu.
    let dropdown_menu_image = document.getElementsByClassName('Dropdown-Menu-Image')[0]
    let body = document.getElementsByTagName('body')[0]
    let dropdown_options_wrapper = document.getElementById('Dropdown-Options-Wrapper')
    body.addEventListener('click', event => {
        let target = event.target
        let target_class_list = [...target.classList]
        if (target !== dropdown_menu_image && !target_class_list.includes('Option')){
            dropdown_options_wrapper.style.visibility = 'hidden'
        }
    })
}

/**
 * The function associated with the click event listener on the 'dropdown_menu_image' element.
 * Sets the visibility of the 'dropdown_options_wrapper' to 'visible' and positions it absolutely
 * in the vicinity of 'dropdown_menu_image'. Is used in function 'JS_addClickListenerToDropdownImage'.
 *
 * @return {void}
 *
 * */
function JS_handleClick(event){

    let outer_dropdown_wrapper = document.getElementById('Dropdown-Options-Wrapper')
    let dropdown_menu_image = document.getElementsByClassName('Dropdown-Menu-Image')[0]

    // adjust the position of the outer wrapper programmatically
    let x_position = dropdown_menu_image.getBoundingClientRect().right-10
    let y_position = dropdown_menu_image.getBoundingClientRect().bottom-10

    outer_dropdown_wrapper.style.position = 'absolute'
    outer_dropdown_wrapper.style.left = x_position+'px'
    outer_dropdown_wrapper.style.top = y_position+'px'
    outer_dropdown_wrapper.style.visibility = 'visible'

}

/**
 * Adds a click event listener to the 'dropdown_menu_image' element that "opens" up
 * the dropdown options.
 *
 * @return {void}
 *
 * */
function JS_addClickListenerToDropdownImage(){
    let dropdown_menu_image = document.getElementsByClassName('Dropdown-Menu-Image')[0]
    dropdown_menu_image.addEventListener('click', event =>  handleClick(event))
}

/**
 * Replace the "lorem picsum" fallback-image of the 'dropdown_menu_image' element with the default image provided
 * by the user.
 *
 * @param   {string}    default_url     The URL representing the image of the default selected option. An element of the
 *                                      user-input 'list_of_image_urls', which in return is collected via WIX Velo attribute
 *                                      setting of the custom element.
 *
 * @return  {void}
 *
 * */
function JS_InsertDefaultImageIntoDropdownTrigger(default_url){
    let dropdown_menu_image = document.getElementsByClassName('Dropdown-Menu-Image')[0]
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
    index_of_currently_selected_element = index_of_default_element

    HTML_createBaseWrappers('https://picsum.photos/200/300')
    HTML_createDropdownMenuDivs(list_of_choices, base_ID, index_of_default_element, list_of_image_urls)
    JS_HandleOnClickCloseMenuDiv(base_ID)
    JS_CloseDropdownIfClickOnlyOnBody()
    JS_AddEventClickListenerDropdownChoices(list_of_image_urls)
    JS_InsertDefaultImageIntoDropdownTrigger(default_image)
    JS_addClickListenerToDropdownImage()
}


/*

            C R E A T I N G    C U S T O M     E L E M E N T
*/


class DropdownCustomComponent extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {

        console.log("entered connected callback")

        // create css tag
        const style = document.createElement('style');
        style.innerHTML = STYLE;
        this.appendChild(style);

        // These are test constants that will be need to set via attributes
        const choice_1 = "Tagesübersicht"
        const choice_2 = "Wochenübersicht"
        const url_1 = "https://picsum.photos/200"
        const url_2 = "https://picsum.photos/300"
        const base_ID = "submoon-choice"

        // assign ID to 'dropdown-custom-component' tag
        this.id = base_ID



        createDOM([choice_1, choice_2],base_ID, 0, [url_1, url_2])

    }}
customElements.define('custom-dropdown-component', DropdownCustomComponent);