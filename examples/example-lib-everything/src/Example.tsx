import * as React from 'react';
import {string} from 'prop-types';

type Props = {
    name: string
}

type State = {};
export default class Example extends React.Component<Props, State> {

    static propTypes = {
        /**
         *  this is a name property
         **/
        name: string
    };

    render() {
        return <div>Hello: {this.props.name}</div>
    }
}
