import { Injectable } from '@angular/core';
import moment from 'moment';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

import { HttpService } from '../../../dataset-api/http.service';
import { InternalDatasetId } from '../../../dataset-api/internal-id-handler.service';
import { Category } from '../../../model/dataset-api/category';
import { TimeValueTuple } from '../../../model/dataset-api/data';
import { FirstLastValue, ParameterConstellation } from '../../../model/dataset-api/dataset';
import { Feature } from '../../../model/dataset-api/feature';
import { Offering } from '../../../model/dataset-api/offering';
import { Phenomenon } from '../../../model/dataset-api/phenomenon';
import { Procedure } from '../../../model/dataset-api/procedure';
import { DataParameterFilter } from '../../../model/internal/http-requests';
import { Timespan } from '../../../model/internal/timeInterval';
import { HELGOLAND_SERVICE_CONNECTOR_HANDLER } from '../../helgoland-services-connector';
import { HelgolandServiceConnector } from '../../interfaces/service-connector-interfaces';
import { HelgolandData, HelgolandDataFilter, HelgolandTimeseriesData } from '../../model/internal/data';
import {
  DatasetExtras,
  DatasetFilter,
  DatasetType,
  HelgolandDataset,
  HelgolandTimeseries,
} from '../../model/internal/dataset';
import { HelgolandCsvExportLinkParams, HelgolandParameterFilter } from '../../model/internal/filter';
import { HelgolandPlatform } from '../../model/internal/platform';
import { HelgolandService } from '../../model/internal/service';
import { Datastream, DatastreamExpandParams, DatastreamSelectParams } from './model/datasetreams';
import { Location, LocationExpandParams, LocationSelectParams } from './model/locations';
import { Observation } from './model/observations';
import { ObservedProperty, ObservedPropertyExpandParams, ObservedPropertySelectParams } from './model/observed-properties';
import { Sensor, SensorExpandParams, SensorSelectParams } from './model/sensors';
import { StaExpandParams, StaFilter, StaSelectParams } from './model/sta-interface';
import { Thing, ThingExpandParams, ThingSelectParams } from './model/things';
import { StaReadInterfaceService } from './read/sta-read-interface.service';

const DEFAULT_SERVICE_LABEL = 'OGC SensorThings API';
const DEFAULT_SERVICE_ID = '1';

@Injectable({
  providedIn: 'root'
})
export class StaApiV1Connector implements HelgolandServiceConnector {

  name = 'StaApiV1Connector';

  constructor(
    protected http: HttpService,
    protected sta: StaReadInterfaceService
  ) { }

  canHandle(url: string): Observable<boolean> {
    return this.http.client().get(url).pipe(
      map((res: any) => {
        if (res && res.value && res.value instanceof Array) {
          // check if endpoint 'Things' exists
          return res.value.findIndex(e => e.name === 'Things') >= 0;
        } else {
          return false;
        }
      }),
      catchError(() => of(false))
    );
  }

  getServices(apiUrl: string, params: HelgolandParameterFilter): Observable<HelgolandService[]> {
    return this.createServices(apiUrl, params);
  }

  getService(id: string, url: string, params: HelgolandParameterFilter): Observable<HelgolandService> {
    return this.createServices(url, params).pipe(map(res => res[0]));
  }

  getCategories(url: string, filter: HelgolandParameterFilter): Observable<Category[]> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of([]); }
    return this.sta.aggregatePaging(this.sta.getObservedProperties(url, this.createCategoriesFilter(filter)))
      .pipe(map(obProps => obProps.value.map(e => this.createCategory(e))));
  }

  getCategory(id: string, url: string, filter: HelgolandParameterFilter): Observable<Category> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of(null); }
    return this.sta.getObservedProperty(url, id).pipe(map(prop => this.createCategory(prop)));
  }

  getOfferings(url: string, filter: HelgolandParameterFilter): Observable<Offering[]> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of([]); }
    return this.sta.aggregatePaging(this.sta.getThings(url, this.createOfferingsFilter(filter)))
      .pipe(map(things => things.value.map(t => this.createOffering(t))));
  }

  protected createOfferingsFilter(params: HelgolandParameterFilter): StaFilter<ThingSelectParams, ThingExpandParams> {
    if (params) {
      const filterList = [];
      return this.createFilter(filterList);
    }
  }

  getOffering(id: string, url: string, filter: HelgolandParameterFilter): Observable<Offering> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of(null); }
    return this.sta.getThing(url, id).pipe(map(t => this.createOffering(t)));
  }

  getPhenomena(url: string, filter: HelgolandParameterFilter): Observable<Phenomenon[]> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of([]); }
    return this.sta.aggregatePaging(this.sta.getObservedProperties(url, this.createPhenomenaFilter(filter)))
      .pipe(map(obsProps => obsProps.value.map(e => this.createPhenomenon(e))));
  }

  protected createPhenomenaFilter(params: HelgolandParameterFilter): StaFilter<ObservedPropertySelectParams, ObservedPropertyExpandParams> {
    if (params) {
      const filterList = [];
      if (params.category) {
        filterList.push(`id eq '${params.category}'`);
      }
      if (params.feature) {
        filterList.push(`Datastreams/Thing/Locations/id eq '${params.feature}'`);
      }
      return this.createFilter(filterList);
    }
  }

  getPhenomenon(id: string, url: string, filter: HelgolandParameterFilter): Observable<Phenomenon> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of(null); }
    return this.sta.getObservedProperty(url, id).pipe(map(prop => this.createPhenomenon(prop)));
  }

  getProcedures(url: string, filter: HelgolandParameterFilter): Observable<Procedure[]> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of([]); }
    return this.sta.aggregatePaging(this.sta.getSensors(url, this.createProceduresFilter(filter)))
      .pipe(map(sensors => sensors.value.map(s => this.createProcedure(s))));
  }

  protected createProceduresFilter(params: HelgolandParameterFilter): StaFilter<SensorSelectParams, SensorExpandParams> {
    if (params) {
      const filterList = [];
      if (params.category) {
        filterList.push(`Datastreams/ObservedProperty/id eq '${params.category}'`);
      }
      // if (params.feature) {
      //     filterList.push(`Datastreams/Thing/Locations/id eq '${params.feature}'`);
      // }
      if (params.phenomenon) {
        filterList.push(`Datastreams/ObservedProperty/id eq '${params.category}'`);
      }
      return this.createFilter(filterList);
    }
    return {};
  }

  getProcedure(id: string, url: string, filter: HelgolandParameterFilter): Observable<Procedure> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of(null); }
    return this.sta.getSensor(url, id).pipe(map(sensor => this.createProcedure(sensor)));
  }

  getFeatures(url: string, filter: HelgolandParameterFilter): Observable<Feature[]> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of([]); }
    return this.sta.aggregatePaging(this.sta.getLocations(url, this.createFeaturesFilter(filter)))
      .pipe(map(locs => locs.value.map(l => this.createFeature(l))));
  }

  protected createFeaturesFilter(params: HelgolandParameterFilter): StaFilter<LocationSelectParams, LocationExpandParams> {
    if (params) {
      const filterList = [];
      if (params.category) {
        filterList.push(`Things/Datastreams/ObservedProperty/id eq '${params.category}'`);
      }
      if (params.phenomenon) {
        filterList.push(`Things/Datastreams/ObservedProperty/id eq '${params.phenomenon}'`);
      }
      if (params.procedure) {
        filterList.push(`Things/Datastreams/Sensor/id eq '${params.procedure}'`);
      }
      return this.createFilter(filterList);
    }
  }

  getFeature(id: string, url: string, filter: HelgolandParameterFilter): Observable<Feature> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of(null); }
    return this.sta.getLocation(url, id).pipe(map(loc => this.createFeature(loc)));
  }

  getPlatforms(url: string, filter: HelgolandParameterFilter): Observable<HelgolandPlatform[]> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of([]); }
    return this.sta.aggregatePaging(this.sta.getLocations(url, this.createStationFilter(filter)))
      .pipe(map(locs => locs.value.map(e => this.createHelgolandPlatform(e))));
  }

  getPlatform(id: string, url: string, filter: HelgolandParameterFilter): Observable<HelgolandPlatform> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of(null); }
    return this.sta.getLocation(url, id, { $expand: 'Things/Datastreams/Thing,Things/Locations,Things/Datastreams/ObservedProperty,Things/Datastreams/Sensor' })
      .pipe(map(loc => this.createExtendedPlatform(loc)));
  }

  protected createCategoriesFilter(params: HelgolandParameterFilter): StaFilter<ObservedPropertySelectParams, ObservedPropertyExpandParams> {
    if (params) {
      const filterList = [];
      if (params.phenomenon) {
        filterList.push(`id eq '${params.phenomenon}'`);
      }
      if (params.feature) {
        filterList.push(`Datastreams/Thing/Locations/id eq '${params.feature}'`);
      }
      if (params.procedure) {
        filterList.push(`Datastreams/Sensor/id eq '${params.procedure}'`);
      }
      return this.createFilter(filterList);
    }
  }

  protected createStationFilter(filter: HelgolandParameterFilter): StaFilter<LocationSelectParams, LocationExpandParams> {
    if (filter) {
      if (filter.phenomenon) {
        return { $filter: `Things/Datastreams/ObservedProperty/id eq '${filter.phenomenon}'` };
      }
    }
  }

  getDatasets(url: string, filter: DatasetFilter): Observable<HelgolandDataset[]> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of([]); }
    return this.sta.aggregatePaging(this.sta.getDatastreams(url, this.createDatastreamFilter(filter)))
      .pipe(mergeMap(ds => {
        return forkJoin(ds.value.map(d => {
          if (filter.expanded) {
            return this.requestExpandedTimeseries(d, url);
          } else {
            return of(this.createTimeseries(d, url));
          }
        }));
      }));
  }

  protected createDatastreamFilter(params: DatasetFilter): StaFilter<DatastreamSelectParams, DatastreamExpandParams> {
    let filter: StaFilter<StaSelectParams, StaExpandParams> = {};
    if (params) {
      const filterList = [];
      if (params.phenomenon) {
        filterList.push(`ObservedProperty/id eq '${params.phenomenon}'`);
      }
      if (params.category) {
        filterList.push(`ObservedProperty/id eq '${params.category}'`);
      }
      if (params.procedure) {
        filterList.push(`Sensor/id eq '${params.procedure}'`);
      }
      if (params.feature) {
        filterList.push(`Thing/Locations/id eq '${params.feature}'`);
      }
      filter = this.createFilter(filterList);
    }
    filter.$expand = 'Thing,Thing/Locations,ObservedProperty,Sensor';
    return filter;
  }

  protected requestExpandedTimeseries(ds: Datastream, apiUrl: string): Observable<HelgolandTimeseries> {
    // get first and last timestamp
    if (ds.phenomenonTime && ds.phenomenonTime.indexOf('/')) {
      const firstLastDates = ds.phenomenonTime.split('/');
      // request for first and last timestamp the values
      const firstReq = this.sta.getDatastreamObservationsRelation(apiUrl, ds['@iot.id'], { $filter: this.createTimeFilter(firstLastDates[0]) });
      const lastReq = this.sta.getDatastreamObservationsRelation(apiUrl, ds['@iot.id'], { $filter: this.createTimeFilter(firstLastDates[1]) });
      return forkJoin([firstReq, lastReq]).pipe(map(res => {
        const first: FirstLastValue = this.createFirstLastValue(res[0].value[0]);
        const last: FirstLastValue = this.createFirstLastValue(res[1].value[0]);
        return this.createExpandedTimeseries(ds, first, last, apiUrl);
      }));
    } else {
      const firstReq = this.sta.getDatastreamObservationsRelation(apiUrl, ds['@iot.id'], { $orderby: 'phenomenonTime', $top: 1 });
      const lastReq = this.sta.getDatastreamObservationsRelation(apiUrl, ds['@iot.id'], { $orderby: 'phenomenonTime desc', $top: 1 });
      return forkJoin([firstReq, lastReq]).pipe(map(res => {
        const first: FirstLastValue = this.createFirstLastValue(res[0].value[0]);
        const last: FirstLastValue = this.createFirstLastValue(res[1].value[0]);
        return this.createExpandedTimeseries(ds, first, last, apiUrl);
      }));
    }
  }

  protected createFirstLastValue(obs: Observation): FirstLastValue {
    if (obs && obs.phenomenonTime && obs.result) {
      return { timestamp: new Date(obs.phenomenonTime).valueOf(), value: parseFloat(obs.result) };
    }
    return null;
  }

  protected createTimeFilter(time: string): string {
    return `phenomenonTime eq ${time}`;
  }

  getDataset(internalId: InternalDatasetId, filter: DatasetFilter): Observable<HelgolandDataset> {
    if (this.filterTimeseriesMatchesNot(filter)) { return of(null); }
    return this.sta.getDatastream(internalId.url, internalId.id, { $expand: 'Thing,Thing/Locations,ObservedProperty,Sensor' })
      .pipe(mergeMap(ds => this.requestExpandedTimeseries(ds, internalId.url)));
  }

  getDatasetData(dataset: HelgolandDataset, timespan: Timespan, filter: HelgolandDataFilter): Observable<HelgolandData> {
    return this.sta.aggregatePaging(
      this.sta.getDatastreamObservationsRelation(dataset.url, dataset.id, { $orderby: 'phenomenonTime', $filter: this.createTimespanFilter(timespan), $top: 200 })
    ).pipe(map(res => this.createData(res.value, filter)));
  }

  createCsvDataExportLink(internalId: string | InternalDatasetId, params: HelgolandCsvExportLinkParams): Observable<string> {
    return of(null);
  }

  getDatasetExtras(internalId: InternalDatasetId): Observable<DatasetExtras> {
    return of({});
  }

  protected createTimespanFilter(timespan: Timespan): string {
    const format = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
    return `phenomenonTime ge ${moment(timespan.from).format(format)} and phenomenonTime le ${moment(timespan.to).format(format)}`;
  }

  protected createHelgolandPlatform(loc: Location): HelgolandPlatform {
    return new HelgolandPlatform(loc['@iot.id'], loc.name, [], loc.location);
  }

  protected createExtendedPlatform(loc: Location): HelgolandPlatform {
    const platform = this.createHelgolandPlatform(loc);
    loc.Things.forEach(thing => {
      thing.Datastreams.forEach(ds => {
        platform.datasetIds.push(`${ds['@iot.id']}`);
      });
    });
    return platform;
  }

  protected createTimeseries(ds: Datastream, url: string): HelgolandDataset {
    return new HelgolandDataset(ds['@iot.id'], url, ds.name);
  }

  protected createTsParameter(ds: Datastream, thing: Thing): ParameterConstellation {
    return {
      service: { id: DEFAULT_SERVICE_ID, label: DEFAULT_SERVICE_LABEL },
      offering: this.createOffering(thing),
      feature: this.createFeature(thing.Locations[0]),
      procedure: this.createProcedure(ds.Sensor),
      phenomenon: this.createPhenomenon(ds.ObservedProperty),
      category: this.createCategory(ds.ObservedProperty)
    };
  }

  protected createExpandedTimeseries(ds: Datastream, first: FirstLastValue, last: FirstLastValue, url: string): HelgolandTimeseries {
    const id = ds['@iot.id'];
    const label = ds.name;
    const uom = ds.unitOfMeasurement.symbol;
    const parameter = this.createTsParameter(ds, ds.Thing);
    const platform = this.createHelgolandPlatform(ds.Thing.Locations[0]);
    return new HelgolandTimeseries(id, url, label, uom, platform, first, last, [], null, parameter);
  }

  protected createData(observations: Observation[], params: DataParameterFilter = {}): HelgolandTimeseriesData {
    const values = observations.map(obs => [new Date(obs.phenomenonTime).getTime(), parseFloat(obs.result as string)] as TimeValueTuple);
    const data = new HelgolandTimeseriesData(values);
    data.referenceValues = {};
    return data;
  }

  protected createFeature(loc: Location): Feature {
    return { id: loc['@iot.id'], label: loc.name };
  }

  protected createOffering(thing: Thing): Offering {
    return { id: thing['@iot.id'], label: thing.name };
  }

  protected createPhenomenon(obsProp: ObservedProperty): Phenomenon {
    return { id: obsProp['@iot.id'], label: obsProp.name };
  }

  protected createCategory(obsProp: ObservedProperty): Category {
    return { id: obsProp['@iot.id'], label: obsProp.name };
  }

  protected createProcedure(sensor: Sensor): Procedure {
    return { id: sensor['@iot.id'], label: sensor.name };
  }

  protected createServices(url: string, paramfilter: HelgolandParameterFilter): Observable<HelgolandService[]> {
    const service = new HelgolandService(
      DEFAULT_SERVICE_ID,
      url,
      DEFAULT_SERVICE_LABEL,
      'STA',
      '1.0',
      {
        categories: 0,
        features: 0,
        offerings: 0,
        phenomena: 0,
        procedures: 0,
        platforms: 0,
        datasets: 0
      }
    );
    if (paramfilter.type && paramfilter.type !== DatasetType.Timeseries) {
      return of([service]);
    }
    const filter = { $count: true, $top: 1 };
    const locationsReq = this.sta.getLocations(url, filter);
    const obPropsReq = this.sta.getObservedProperties(url, filter);
    const thingsReq = this.sta.getThings(url, filter);
    const sensorsReq = this.sta.getSensors(url, filter);
    const datastreamsReq = this.sta.getDatastreams(url, filter);
    return forkJoin([locationsReq, obPropsReq, thingsReq, sensorsReq, datastreamsReq]).pipe(map(res => {
      service.quantities.categories = res[1]['@iot.count'];
      service.quantities.features = res[0]['@iot.count'];
      service.quantities.offerings = res[2]['@iot.count'];
      service.quantities.phenomena = res[1]['@iot.count'];
      service.quantities.procedures = res[3]['@iot.count'];
      service.quantities.platforms = res[0]['@iot.count'];
      service.quantities.datasets = res[4]['@iot.count'];
      return [service];
    }));
  }

  // protected createPlatform(loc: Location): Platform {
  //   return {
  //     id: loc['@iot.id'],
  //     label: loc.name,
  //     platformType: PlatformTypes.stationary,
  //     datasets: [],
  //     geometry: loc.location as GeoJSON.Point,
  //   };
  // }

  protected createFilter(filterList: any[]): StaFilter<StaSelectParams, StaExpandParams> {
    if (filterList.length > 0) {
      return { $filter: filterList.join(' and ') };
    }
    return {};
  }

  protected filterTimeseriesMatchesNot(filter: HelgolandParameterFilter): boolean {
    return filter.type && filter.type !== DatasetType.Timeseries;
  }

}

export const DatasetStaConnectorProvider = {
  provide: HELGOLAND_SERVICE_CONNECTOR_HANDLER,
  useClass: StaApiV1Connector,
  multi: true
};
