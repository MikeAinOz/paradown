/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "core-js/stable";
import * as d3select from 'd3-selection';
import { saveAs } from 'file-saver';
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { VisualSettings } from "./settings";
export class Visual implements IVisual {
   
    private settings: VisualSettings;
    private container: d3.Selection<any, any, any, any>;
    private tablecontainer: d3.Selection<any, any, any, any>;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        
        /** Visual container */
        this.container = d3select.select(options.element)
          .append('div')
          .append('input')
            .attr('id',"bDownload")
        this.tablecontainer = d3select.select(options.element)
            .append('table');  
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        console.log('Visual update', options);
        /** Clear down existing plot */
        this.tablecontainer.selectAll('*').remove();

        /** Test 1: Data view has valid bare-minimum entries */
        let dataViews = options.dataViews;    
        console.log('Test 1: Valid data view...');
        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].table
            || !dataViews[0].table.rows
            || !dataViews[0].table.columns
            || !dataViews[0].metadata
        ) {
            console.log('Test 1 FAILED. No data to draw table.');
            return;
        }
    
    /** If we get this far, we can trust that we can work with the data! */
        let table = dataViews[0].table;       
    /** Add table heading row and columns */
        let tHead = this.tablecontainer
            .append('tr');
        table.columns.forEach(
            (col) => {
                tHead
                    .append('th')
                        .text(col.displayName);
            }
        );

    /** Now add rows and columns for each row of data */
        table.rows.forEach(
            (row) => {
                let tRow = this.tablecontainer
                    .append('tr');
                row.forEach(
                    (col) => {
                        if (col)
                        {tRow
                            .append('td')
                                .text(col.toString())}
                        else
                        {tRow
                            .append('td')
                                .text("")}
                    }
                )
            }
        );
        console.log('Table rendered!');
// Button
        let dButton = d3select.select('#bDownload')
            .attr('type', "submit")
            .attr('value', "Download CSV")
        .on ('click' , function(){
            let headers = []
            table.columns.forEach(
                (col) => {
                    headers.push(col.displayName);
                })
            let downloadtable = []
            downloadtable.push(headers)
            
            table.rows.forEach(
                (row) => {
                    downloadtable.push(row)
                }
            )
            
            //let download = JSON.stringify(downloadtable);
            let download = ConvertToCSV(downloadtable)
            let blob = new Blob([download], {type: "text/plain;charset=utf-8"});
            console.log('Attempt Save!');
            saveAs(blob, "pbidownload.csv");
            
        });
     // JSON to CSV Converter
     function ConvertToCSV(objArray) {
        let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
        let str = '';

        for (let i = 0; i < array.length; i++) {
            let line = '';
            for (var index in array[i]) {
                if (line != '') line += ','

                line += array[i][index];
            }

            str += line + '\r\n';
        }

        return str;
    }   
        
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}