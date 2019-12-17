import * as React from 'react';
import renderer from 'react-test-renderer';
import {{{Component}}} from '../';


test('Should render {{Component}}', () => {
    const underTest = renderer.create(<{{Component}}/>);
    expect(underTest).toMatchSnapshot();
});
