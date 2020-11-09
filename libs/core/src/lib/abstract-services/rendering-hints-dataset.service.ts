import { DatasetType, HelgolandTimeseries } from '../api-communication/model/internal/dataset';
import { BarRenderingHints, LineRenderingHints } from '../model/dataset-api/dataset';
import { DatasetOptions } from '../model/internal/options';
import { HelgolandServicesConnector } from '../api-communication/helgoland-services-connector';
import { DatasetService } from './dataset.service';

export abstract class RenderingHintsDatasetService<T extends DatasetOptions | DatasetOptions[]> extends DatasetService<T> {

    constructor(
        protected servicesConnector: HelgolandServicesConnector
    ) {
        super();
    }

    public async addDataset(internalId: string, options?: T): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (this.datasetIds.indexOf(internalId) < 0) {
                if (options) {
                    this.datasetIds.push(internalId);
                    this.datasetOptions.set(internalId, options);
                    this.datasetIdsChanged.emit(this.datasetIds);
                    this.saveState();
                    resolve(true);
                } else {
                    this.servicesConnector.getDataset(internalId, { type: DatasetType.Timeseries })
                        .subscribe(dataset => this.addLoadedDataset(dataset, resolve));
                }
            }
        });
    }

    protected async addLoadedDataset(timeseries: HelgolandTimeseries, resolve: (value?: boolean | PromiseLike<boolean>) => void) {
        this.datasetIds.push(timeseries.internalId);
        this.datasetOptions.set(timeseries.internalId, this.createOptionsOfRenderingHints(timeseries));
        this.datasetIdsChanged.emit(this.datasetIds);
        this.saveState();
        resolve(true);
    }

    protected createOptionsOfRenderingHints(timeseries: HelgolandTimeseries): T {
        const options = this.createStyles(timeseries.internalId) as DatasetOptions;
        if (timeseries.renderingHints) {
            if (timeseries.renderingHints.properties && timeseries.renderingHints.properties.color) {
                options.color = timeseries.renderingHints.properties.color;
            }
            switch (timeseries.renderingHints.chartType) {
                case 'line':
                    this.handleLineRenderingHints(timeseries.renderingHints as LineRenderingHints, options);
                    break;
                case 'bar':
                    this.handleBarRenderingHints(timeseries.renderingHints as BarRenderingHints, options);
                    break;
                default:
                    break;
            }
        }
        return options as T;
    }


    protected handleLineRenderingHints(lineHints: LineRenderingHints, options: DatasetOptions) {
        if (lineHints.properties.width) {
            options.lineWidth = Math.round(parseFloat(lineHints.properties.width));
        }
    }

    protected handleBarRenderingHints(barHints: BarRenderingHints, options: DatasetOptions) {
        options.type = 'bar';
        if (barHints && barHints.properties.width) {
            options.lineWidth = Math.round(parseFloat(barHints.properties.width));
        }
        if (barHints && barHints.properties.interval) {
            if (barHints.properties.interval === 'byDay') {
                options.barPeriod = 'P1D';
            }
            if (barHints.properties.interval === 'byHour') {
                options.barPeriod = 'PT1H';
            }
        }
    }
}
