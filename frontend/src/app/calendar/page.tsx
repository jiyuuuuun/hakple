'use client'

import React, { Component } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

class MyCalendar extends Component {
    render() {
        return (
          <div className="App">
            <FullCalendar 
              initialView="dayGridMonth" 
              plugins={[ dayGridPlugin ]}
            />
          </div>
        );
    }
}
export default MyCalendar;