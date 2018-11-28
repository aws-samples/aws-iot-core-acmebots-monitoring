import React, { Component } from 'react';
import { Menu } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

export default class IotTutorialMenu extends Component {
    state = { activeItem: 'home' };

    handleItemClick = (e, { name }) => this.setState({ activeItem: name });

    render() {
        const { activeItem } = this.state;

        return (
            <Menu>
                <Menu.Item as={Link} to ='/' name='home' active={activeItem === 'home'} onClick={this.handleItemClick}>
                </Menu.Item>
                <Menu.Item as={Link} to='things' name='things' active={activeItem === 'things'} onClick={this.handleItemClick} />
                <Menu.Item as={Link} to='operations' name='operations' active={activeItem === 'operations'} onClick={this.handleItemClick} />
            </Menu>
        );
    }
}