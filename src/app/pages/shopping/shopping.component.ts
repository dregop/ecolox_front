import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterContentChecked, AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, debounceTime, distinctUntilChanged, fromEvent, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { ToastService, toastType } from 'src/app/services/toast.service';
import { API_URL } from 'src/environments/env.dev';
import { GraphService } from '../internet/services/graph.service';
import { Route, Router } from '@angular/router';
import { ShoppingService } from './services/shopping.service';
import { ShoppingApiService } from 'src/app/services/shopping.service';

export  class Product {
  name?: string;
  date!: any;
  weight!: number; // kg
  co2ByKg!: number;
  co2!: number;
}

@Component({
  selector: 'shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.scss']
})
export class ShoppingComponent implements OnInit {

  @ViewChild('carSearchInput') carSearchInput!: ElementRef;

  public showSearches: boolean = false;
  public isSearching:boolean = false;
  public searchedProduct: any = [];
  public dataSearch: any[] = [];
  public currentDate = new Date();
  public selectedProduct: Product = {name: '', co2ByKg: 0, weight: 1, date: new Date(), co2: 0};
  public dbProducts: Product[] = [];
  public formatDate!: any;
  public loadingData = false;

  constructor(private http: HttpClient, private shoppingApiService: ShoppingApiService, public toastService: ToastService, private shoppingService: ShoppingService, private cdRef:ChangeDetectorRef) {
    console.log(this.selectedProduct);
    // this.selectedProduct.date = this.currentDate.getFullYear() + '-' + (this.currentDate.getMonth() + 1) + '-' + this.currentDate.getDate();
  }

  ngOnInit() {

    this.shoppingService.setD3Locale(); // initiate date 
    this.loadingData = true;
    this.shoppingApiService.getProducts().subscribe({
      next: (val) => {
        if (val && val.data) {
          this.loadingData = false;
          this.formatDate = this.shoppingService.d3Locale.format("%-d %b %Y à %H:%M");
          this.dbProducts = JSON.parse(val.data);
          this.dbProducts = this.shoppingService.formatDate(this.dbProducts);
          console.log(val.data);
          const co2_shopping = document.getElementById('co2_shopping');
          if (co2_shopping && this.dbProducts.length > 0) {
            co2_shopping.innerHTML = this.dbProducts[this.dbProducts.length - 1].co2.toFixed(1) + ' kgCo<sub>2</sub>e';
          }
        }
      },
      error: (error) => {
        console.log(error);
    }});

    const  barButton = document.getElementById('barButton');
    const  lineButton = document.getElementById('lineButton');
    const  listButton = document.getElementById('listButton');
    
    barButton?.addEventListener('click', () => {
      barButton.className = 'btn-graph activated';     
      if (lineButton) {
        lineButton.className = 'btn-graph';
      }
      if (listButton) {
        listButton.className = 'btn-graph';
      }
    });

    lineButton?.addEventListener('click', () => {
      lineButton.className = 'btn-graph activated';     
      if (barButton) {
        barButton.className = 'btn-graph';
      }
      if (listButton) {
        listButton.className = 'btn-graph';
      }
    });

    listButton?.addEventListener('click', () => {
      listButton.className = 'btn-graph activated';     
      if (barButton) {
        barButton.className = 'btn-graph';
      }
      if (lineButton) {
        lineButton.className = 'btn-graph';
      }
    });
  }

  handleData(dataFromDb: any):string[] {
    let newData: string[] = [];
    const names = dataFromDb['Nom du Produit en Français'];
    const co2ByKg = dataFromDb['kg CO2 eq/kg de produit'];
    for (const [key, value] of Object.entries(names)) {
      newData.push(value as string);
      console.log({name: value, co2ByKg: co2ByKg[key]});
      this.dataSearch.push({name: value, co2ByKg: (co2ByKg[key] as number).toFixed(2)});
    };
    console.log(newData);
    return newData;
  }

  productSearch() {
    // Adding keyup Event Listerner on input field
    const search$ = fromEvent(this.carSearchInput.nativeElement, 'keyup').pipe(
      map((event: any) => event.target.value),
      debounceTime(300),  
      distinctUntilChanged(),
      tap(()=> this.isSearching = true),
      switchMap((term) => term ? this.getProductByName(term) : ''),
      tap(() => {
        this.isSearching = false,
        this.showSearches = true;
      }));

      search$.subscribe(data => {
        this.isSearching = false
        this.searchedProduct = this.handleData(data);
      });
  }

  getProductByName(name: string): Observable<any> {
    //  return of(this.filterCars(name)) //used `of` to convert array to Observable
     return this.http.get<any>(API_URL + '/food?name=' + name)
     .pipe(
         shareReplay() // prevent multiple http call
       ); 
   }
 
  //  filterCars(name: string) {
  //    return this.cars.filter((val: string) => val.toLowerCase().startsWith(name.toLowerCase()) == true )
  //  }

   setProductSelected(name: string) {
    this.selectedProduct = this.dataSearch.filter((data: any) => data.name === name)[0];
    
    this.selectedProduct.weight = 1;
    this.selectedProduct.date = new Date();
    this.showSearches = false;

    const addProduct = document.getElementById('add_product');
    // const overlay_product = document.getElementById('overlay_product');
    if (addProduct) {
      addProduct.style.display = 'flex';
      // overlay_product.style.display = 'flex';
    }
  }

  trackById(index: number,item: any):void{
    return item._id;
  }

  addProduct():void{
    if (this.selectedProduct.co2ByKg && this.selectedProduct.weight) {
      let previousCo2 = 0;
      if (this.dbProducts.length > 0) {
        previousCo2 = this.dbProducts[this.dbProducts.length - 1].co2;
      }
      this.selectedProduct.co2 = previousCo2 + this.selectedProduct.co2ByKg * this.selectedProduct.weight;

      if (isNaN(this.selectedProduct.weight)) {
        this.toastService.handleToast(toastType.Error, 'Valeur du poids incorrecte !');
        return;
      }
    } else {
      this.toastService.handleToast(toastType.Error, 'Valeur du poids incorrecte !');
      return;
    }

    console.log(this.selectedProduct);

    if (this.dbProducts && this.dbProducts.length === 0) {
      this.shoppingApiService.saveProduct({
        'category': 'shopping',
        'data': JSON.stringify([this.selectedProduct])
      }).subscribe({
        next: (val) => {
          if (val && val.data) {
            console.log(val.data);
            this.dbProducts.push(this.selectedProduct);
            this.toastService.handleToast(toastType.Success, 'Produit enregistré avec succès !');
            const addProduct = document.getElementById('add_product');
            // const overlay_product = document.getElementById('overlay_product');
            if (addProduct) {
              addProduct.style.display = 'none';
              // overlay_product.style.display = 'flex';
            }
            const co2_shopping = document.getElementById('co2_shopping');
            if (co2_shopping) {
              co2_shopping.innerHTML = this.dbProducts[this.dbProducts.length - 1].co2.toFixed(1) + ' kgCo<sub>2</sub>e';
            }
  
          }
        },
        error: (error) => {
          console.log(error);
      }});
    } else {
      this.dbProducts.push(this.selectedProduct);
      this.shoppingApiService.updateProduct({
        'category': 'shopping',
        'data': JSON.stringify(this.dbProducts)
      }).subscribe({
        next: (val) => {
          if (val && val.data) {
            console.log(val.data);
            this.toastService.handleToast(toastType.Success, 'Produit enregistré avec succès !');
            const addProduct = document.getElementById('add_product');
            // const overlay_product = document.getElementById('overlay_product');
            if (addProduct) {
              addProduct.style.display = 'none';
              // overlay_product.style.display = 'flex';
            }
            const co2_shopping = document.getElementById('co2_shopping');
            if (co2_shopping) {
              co2_shopping.innerHTML = this.dbProducts[this.dbProducts.length - 1].co2.toFixed(1) + ' kgCo<sub>2</sub>e';
            }
  
          }
        },
        error: (error) => {
          console.log(error);
      }});
    }
  }

  public removeProduct(index: number, product: Product) {
    const trueIndex = this.dbProducts.length - index - 1; // cause ng for reverse
    // We need to reactualize the co2 for each when we delete
    if (this.dbProducts.length > 0) {
      console.log(this.dbProducts[this.dbProducts.length - 1].co2);
      console.log(this.dbProducts[trueIndex].co2ByKg * this.dbProducts[trueIndex].weight);
      this.dbProducts[this.dbProducts.length - 1].co2 = this.dbProducts[this.dbProducts.length - 1].co2 - this.dbProducts[trueIndex].co2ByKg * this.dbProducts[trueIndex].weight;
    }
    this.dbProducts.splice(trueIndex, 1);
    this.shoppingApiService.updateProduct({
      'category': 'shopping',
      'data': JSON.stringify(this.dbProducts)
    }).subscribe({
      next: () => {
        this.toastService.handleToast(toastType.Info, product.name + ' Supprimé !');
      },
      error: () => {

      }
    });
  }

  public closeAddProduct(): void {
    const overlay = document.getElementById('add_product');
    if (overlay) {
      overlay.style.display = 'none';
    } 
  }

  public displayBarChart() {
    const  barButton = document.getElementById('barButton');
    if (barButton?.className.includes('activated')) {
      return true;
    } else {
      return false;
    }
  }

  public displayLineChart() {
    const  lineButton = document.getElementById('lineButton');
    if (lineButton?.className.includes('activated')) {
      return true;
    } else {
      return false;
    }
  }

  public displayList() {
    const  lineButton = document.getElementById('listButton');
    if (lineButton?.className.includes('activated')) {
      return true;
    } else {
      return false;
    }
  }

}
