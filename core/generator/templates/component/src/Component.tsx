import * as React from 'react';
import {themeClass} from '@paypal/merchant-react-base';

type Props = {
    name:string
};

type State = {};

export class {{Component}} extends React.PureComponent<Props,State> {

    static displayName = '{{Component}}';

    render(){
        return <div className={tc('container')}>{this.props.name}</div>
    }
}

const tc = themeClass({{Component}});