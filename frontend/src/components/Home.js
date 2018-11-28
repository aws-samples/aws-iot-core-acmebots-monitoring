import React, { Component } from 'react';
import { Container, Header, Image, Item } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

export default class HomePage extends Component {

    render() {

        return (
            <div>
                <Header as='h1'>
                    <Image circular src='/images/aws-iot.png'/>
                    Acme-Bots IoT Application
                </Header>
                <Container textAlign='left'>
                    Acme Bots offers robotics services for customers in several
                    industries, such as (but not limited to) entertainment, 
                    security, oil & gas, building, retail and manufacturing.
                </Container>

                <Container textAlign='left'>
                    <Image src='/images/acmebots-architecture.png'/>
                </Container>

            </div>
        )
    }
}
