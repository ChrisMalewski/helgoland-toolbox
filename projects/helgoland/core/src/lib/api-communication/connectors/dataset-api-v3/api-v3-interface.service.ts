import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiInterface } from '../../../abstract-services/api-interface';
import { UriParameterCoder } from '../../../dataset-api/api-interface';
import { HttpService } from '../../../dataset-api/http.service';
import { Service } from '../../../model/dataset-api/service';
import { HttpRequestOptions, ParameterFilter } from '../../../model/internal/http-requests';

export interface ApiV3Parameter {
  id: string;
}

export interface ApiV3Feature extends ApiV3Parameter {
  properties: {
    label: string;
    href: string;
    domainId: string;
  };
  type: string;
  geometry: GeoJSON.GeometryObject;
}

export interface ApiV3Category extends ApiV3Parameter {
  href: string;
  domainId: string;
  label: string;
}

export interface ApiV3Offering extends ApiV3Parameter {
  href: string;
  domainId: string;
  label: string;
}

export interface ApiV3Phenomenon extends ApiV3Parameter {
  href: string;
  domainId: string;
  label: string;
}

export interface ApiV3Procedure extends ApiV3Parameter {
  href: string;
  domainId: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiV3InterfaceService extends ApiInterface {

  constructor(
    protected httpService: HttpService,
    protected translate: TranslateService
  ) { super(); }

  public getServices(apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<Service[]> {
    const url = this.createRequestUrl(apiUrl, 'services');
    return this.requestApi<Service[]>(url, params, options)
      .pipe(map(res => res.map(e => this.createService(e, apiUrl))));
  }

  public getCategories(apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Category[]> {
    const url = this.createRequestUrl(apiUrl, 'categories');
    return this.requestApi<ApiV3Category[]>(url, params, options);
  }

  public getCategory(id: string, apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Category> {
    const url = this.createRequestUrl(apiUrl, 'categories', id);
    return this.requestApi<ApiV3Category>(url, params, options);
  }

  public getOfferings(apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Offering[]> {
    const url = this.createRequestUrl(apiUrl, 'offerings');
    return this.requestApi<ApiV3Offering[]>(url, params, options);
  }

  public getOffering(id: string, apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Offering> {
    const url = this.createRequestUrl(apiUrl, 'offerings', id);
    return this.requestApi<ApiV3Offering>(url, params, options);
  }

  public getPhenomena(apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Phenomenon[]> {
    const url = this.createRequestUrl(apiUrl, 'phenomena');
    return this.requestApi<ApiV3Phenomenon[]>(url, params, options);
  }

  public getPhenomenon(id: string, apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Phenomenon> {
    const url = this.createRequestUrl(apiUrl, 'phenomena', id);
    return this.requestApi<ApiV3Phenomenon>(url, params, options);
  }

  public getFeatures(apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Feature[]> {
    const url = this.createRequestUrl(apiUrl, 'features');
    return this.requestApi<ApiV3Feature[]>(url, params, options);
  }

  public getFeature(id: string, apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Feature> {
    const url = this.createRequestUrl(apiUrl, 'features', id);
    return this.requestApi<ApiV3Feature>(url, params, options);
  }

  public getProcedures(apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Procedure[]> {
    const url = this.createRequestUrl(apiUrl, 'procedures');
    return this.requestApi<ApiV3Procedure[]>(url, params, options);
  }

  public getProcedure(id: string, apiUrl: string, params?: ParameterFilter, options?: HttpRequestOptions): Observable<ApiV3Procedure> {
    const url = this.createRequestUrl(apiUrl, 'procedures', id);
    return this.requestApi<ApiV3Procedure>(url, params, options);
  }

  protected requestApi<T>(
    url: string, params: ParameterFilter = {}, options: HttpRequestOptions = {}
  ): Observable<T> {
    return this.httpService.client(options).get<T>(url,
      {
        params: this.prepareParams(params),
        headers: this.createBasicAuthHeader(options.basicAuthToken)
      }
    );
  }

  protected prepareParams(params: ParameterFilter): HttpParams {
    if (this.translate && this.translate.currentLang) {
      params.locale = this.translate.currentLang;
    }
    let httpParams = new HttpParams({
      encoder: new UriParameterCoder()
    });
    Object.getOwnPropertyNames(params)
      .forEach((key) => httpParams = httpParams.set(key, params[key]));
    return httpParams;
  }

  private createService(service: Service, url: string): Service {
    service.apiUrl = url;
    if (service.quantities && service.quantities.datasets && service.quantities.datasets['total']) {
      service.quantities.datasets = service.quantities.datasets['total'];
    }
    return service;
  }

}
