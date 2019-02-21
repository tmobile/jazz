import React, { Component } from 'react';
import { Nav, Navbar, NavDropdown, Container } from 'react-bootstrap';
class Header extends Component {
    render() {
        return (
            <Navbar fixed="top" expand="lg" collapseOnSelect>
                <Container>
                    <div className="navbar-header">
                        <Navbar.Brand href="#home"><span className="glyphicon glyphicon-fire"></span> LOGO</Navbar.Brand>
                        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                    </div>
                    <Navbar.Collapse id="navbar" className="justify-content-end">
                        <Nav.Link href="#">Home</Nav.Link>
                        <Nav.Link href="#" className="inactive">Menu Item</Nav.Link>
                        <NavDropdown title="Service" id="collasible-nav-dropdown" className="inactive">
                            <NavDropdown.Item href="#" className="inactive">Menu item</NavDropdown.Item>
                            <NavDropdown.Item href="#" className="inactive">Menu item</NavDropdown.Item>
                            <NavDropdown.Item href="#" className="inactive">Menu item</NavDropdown.Item>
                        </NavDropdown>
                        <Nav.Link href="#pricing">Contact</Nav.Link>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

        );
    }
}


export default Header;