import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { D3GeneralDatasetInput, D3GeneralInput } from '@helgoland/d3';

@Component({
    templateUrl: './d3-general-popup.component.html',
    styleUrls: ['./d3-general-popup.component.scss']
})
export class D3GeneralPopupComponent {

    @Input()
    public generalInput: D3GeneralInput;

    constructor(
        public dialogRef: MatDialogRef<D3GeneralPopupComponent>,
        @Inject(MAT_DIALOG_DATA)
        public dataset: D3GeneralDatasetInput[]
    ) {
        this.generalInput = {
            datasets: this.dataset,
            plotOptions: null
        }
        console.log(this.generalInput);
    }

    public onClose() {
        this.dialogRef.close('closes');
    }

}
