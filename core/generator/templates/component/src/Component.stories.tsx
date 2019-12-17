import * as React from 'react';
import { text } from "@storybook/addon-knobs";
//Component for the story.
import { {{Component}} } from "./index";


export const basicUsage{{Component}} = () =>{
    const name = text('Name', '{{Component}}');
    return <{{Component}} name={name}/>

};

export default ({
    title: "{{description}}"
})