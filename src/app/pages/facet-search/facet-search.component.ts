import { Component } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material';
import { DatasetApiInterface, Timeseries, Timespan } from '@helgoland/core';
import { FacetSearchService, ParameterFacetType } from '@helgoland/facet-search';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'n52-facet-search',
  templateUrl: './facet-search.component.html',
  styleUrls: ['./facet-search.component.scss']
})
export class FacetSearchComponent {

  public timeseries: Timeseries[];

  public categoryType: ParameterFacetType = ParameterFacetType.category;
  public featureType: ParameterFacetType = ParameterFacetType.feature;
  public offeringType: ParameterFacetType = ParameterFacetType.offering;
  public phenomenonType: ParameterFacetType = ParameterFacetType.phenomenon;
  public procedureType: ParameterFacetType = ParameterFacetType.procedure;

  public categoryAutocomplete: string;
  public featureAutocomplete: string;
  public offeringAutocomplete: string;
  public phenomenonAutocomplete: string;
  public procedureAutocomplete: string;

  public resultCount: number;
  public showMap = true;
  public resetAllDisabled: boolean;

  public selectedStart: Date;
  public selectedEnd: Date;

  constructor(
    private api: DatasetApiInterface,
    public facetSearch: FacetSearchService
  ) {

    forkJoin([
      this.api.getTimeseries('https://fluggs.wupperverband.de/sos2/api/v1/', { expanded: true }),
      // this.api.getTimeseries('http://sensorweb.demo.52north.org/sensorwebtestbed/api/v1/', { expanded: true }),
      // this.api.getTimeseries('http://sensorweb.demo.52north.org/sensorwebclient-webapp-stable/api/v1/', { expanded: true }),
      // this.api.getTimeseries('http://geo.irceline.be/sos/api/v1/', { expanded: true }),
      // this.api.getTimeseries('http://monalisasos.eurac.edu/sos/api/v1/', { expanded: true }),
    ]).subscribe(res => {
      const complete = [];
      res.forEach(e => complete.push(...e));
      this.facetSearch.setTimeseries(complete);
    });

    this.facetSearch.getResults().subscribe(ts => {
      this.resultCount = ts.length;
      this.fetchTime();
      this.resetAllDisabled = !this.facetSearch.areFacetsSelected();
    });
  }

  public onSelectedTs(ts: Timeseries) {
    alert(`Clicked: ${ts.label}`);
  }

  public toggleResultView() {
    this.showMap = !this.showMap;
  }

  public resetAllFacets() {
    this.facetSearch.resetAllFacets();
  }

  public setStart(start: MatDatepickerInputEvent<Date>) {
    this.facetSearch.setSelectedTimespan(new Timespan(start.value, this.selectedEnd));
  }

  public setEnd(end: MatDatepickerInputEvent<Date>) {
    this.facetSearch.setSelectedTimespan(new Timespan(this.selectedStart, end.value));
  }

  private fetchTime() {
    const timespan = this.facetSearch.getSelectedTimespan();
    this.selectedStart = new Date(timespan.from);
    this.selectedEnd = new Date(timespan.to);
  }

}