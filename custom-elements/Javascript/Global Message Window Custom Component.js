
/*

            C U S T O M    G L O B A L    C O M M U N I C A T I O N S    W I N D O W
            A custom communication window that displays elements like 'copied to clipboard!' (sticky).
            Is triggered when attributes are set on it with Wix Velo.
            Default Toolbar with default text is constructed via the 'ConnectedCallback()', but
            the visibility is set to hidden. When attributes are changed via Wix Velo, the
            window is filled with the non-default values provided. This happens inside the
            'attributeChangedCallback()'. Only if the attribute 'set_visible' is changed by
            Wix Velo to 'true', the element is displayed (code inside of 'attributeChangedCallback()').
            After 3000 milliseconds, the global window fades out and 'set_visible' is set to 'false'.

            THEREFORE THE LAST ATTRIBUTE TO BE SET BY WIX VELO IS ALWAYS 'set_visible'.

*/

/*

            A T T R I B U T E S    T O    B E    S E T

            - 'text-message'            {string}    The message to display in the global message window.
            - 'link-info'               {string}    A link that should be displayed at the end of 'text-message'.
                                                    A string consisting of two parts, separated by a comma: the text
                                                    to display, and the acutal link.
            - 'background-color'        {string}    The background color of the global message div.
            - 'color'                   {string}    The text color of the global message div.
            - 'font-size'               {string}    The font-size. Something like '3em' or '10px'. Also determines height of the icon!
            - 'icon-url'                {string}    The URL of a media to be displayed left next to the message.
            - 'time-out'                {string}    A string representing the milliseconds the window is visible until it disappears
            - 'set-visible'             {string}    A string representing a truthy value. Default when element is constructed is 'false'.


            Exemplary attribute collection:

            $w('#global_window').setAttribute('text-message','Copied to clipboard!')
            $w('#global_window').setAttribute('background-color','green')
            $w('#global_window').setAttribute('color','white')
            $w('#global_window').setAttribute('font-size','3em')
            $w('#global_window').setAttribute('icon-url','lorem-picsum.png')
            $w('#global_window').setAttribute('time-out','3000')
            $w('#global_window').setAttribute('set_visible',true)

*/


/*

            D E F I N I T I O N    O F    C S S
*/


const STYLE = `

    #Custom-Element-Global-Message-Window{
        width:max-content;
        padding: 10px 10px 10px 10px;
        border-radius: 15px;
        margin:0 auto;
        font-size: 3em;
        color:black;
        background-color:white;
        text-align:center;
        visibility: visible;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    img{
    padding-right: 15px;
    }
    

 
`;

/*

            H E L P E R    F U N C T I O N S
*/


function HTML_createWindow(set_visible, icon_url, color, background_color, text_message, link_info=null, font_size, image_height) {
    let custom_element_instance = document.getElementById('Custom-Element-Global-Message-Window')

    // create the css for the custom element
    const style = document.createElement('style');
    style.innerHTML = STYLE;
    custom_element_instance.appendChild(style);

    const image = document.createElement('img')
    image.style.height = image_height
    image.id = 'Icon-Custom-Element-Global-Message-Window'
    image.src = icon_url

    const text_node = document.createTextNode(text_message)

    custom_element_instance.appendChild(image)
    custom_element_instance.appendChild(text_node)

    if (link_info && link_info!==""){
        const description = link_info.split(",")[0]
        const link = link_info.split(",")[1]
        const linkElement = document.createElement('a')
        linkElement.href = link
        linkElement.target = "_blank"
        linkElement.textContent = " : " + description
        linkElement.style.color = "yellow"
        custom_element_instance.appendChild(linkElement)
    }

    custom_element_instance.style.color = color
    custom_element_instance.style.fontSize = font_size
    custom_element_instance.style.backgroundColor = background_color
}

function JS_setTimeoutFade(time_out){
    let custom_element_instance = document.getElementById('Custom-Element-Global-Message-Window')
    setTimeout(()=>{
        custom_element_instance.style.visibility = 'hidden'
    },time_out)
}


/*

            C R E A T I N G    C U S T O M     E L E M E N T
*/

var attribute_dict = {}

class GlobalMessageWindow extends HTMLElement {


    attributeChangedCallback(name, oldValue, newValue){


        attribute_dict[`${name}`] = newValue
        this.id = 'Custom-Element-Global-Message-Window'

        if ((Object.entries(attribute_dict).length === 7 || Object.entries(attribute_dict).length === 8 ) && attribute_dict['set-visible'] === 'true'){

            //console.log("the dict is complete, creating window. Length: ", Object.entries(attribute_dict).length, " and set visible is ", attribute_dict['set-visible'] )

            const set_visible = this.getAttribute('set-visible')
            const icon_url = this.getAttribute('icon-url')
            const color = this.getAttribute('color')
            const background_color = this.getAttribute('background-color')
            const text_message = this.getAttribute('text-message')
            const font_size = this.getAttribute('font-size')
            const icon_height = this.getAttribute('icon-height')
            const time_out = +this.getAttribute('time-out')
            const link_info = this.getAttribute('link-info')

            // if there already exists an instance, clear its innerHTML and show it
            let custom_element_instance = document.getElementById('Custom-Element-Global-Message-Window')
            if (custom_element_instance){
                custom_element_instance.innerHTML = ''
                custom_element_instance.style.visibility = 'visible'
            }

            // perform sanity-check by constructing HTML only when text_message is non-empty string
            if (text_message!==""){
                HTML_createWindow(set_visible, icon_url, color, background_color,
                    text_message, link_info, font_size, icon_height)
                JS_setTimeoutFade(time_out)
            }
            /*
            // clear everything after 'JS_setTimeoutFade()' which needs a bit more than 2100 milliseconds to execute.
            setTimeout(()=>{
                // clear inner html after faded out
                this.innerHTML = ''

                // setting 'set-visible' attribute to 'false', such that the inner code layer of 'attributeChangedCallback' is not reached at this point in time.
                this.setAttribute('set-visible', 'false')

                // before clearing outer html, disappear the element so to hide the step-by-step deconstruction of its elements.
                this.style.visibility = 'hidden'
                console.log(" All Attributes: ", this.attributes)
                // clear outer HTML
                for (let i=0; i < this.attributes.length; i++){
                    console.log("Removing attribute ",this.attributes[i].name)
                    //this.removeAttribute(this.attributes[i].name)
                }


            },2500)
            */



        }
    }

    // define which attributes 'attributeChangedCallback' should surveil
    static get observedAttributes() {
        return ['text-message', 'background-color', 'color', 'set-visible','icon-url','font-size', 'icon-height', 'link-info'];
    }


}

customElements.define('global-message-window-custom-component', GlobalMessageWindow);