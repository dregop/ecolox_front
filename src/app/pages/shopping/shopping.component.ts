import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterContentChecked, AfterContentInit, AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, debounceTime, distinctUntilChanged, fromEvent, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { GraphService } from 'src/app/chart/services/graph.service';
import { ShoppingService } from 'src/app/services/shopping.service';
import { ToastService, toastType } from 'src/app/services/toast.service';
import { API_URL } from 'src/environments/env.dev';

export  class Product {
  name!: string;
  date!: Date;
  weight!: number; // kg
  quantity?: number; 
  co2ByKg!: number;
}

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.scss']
})
export class ShoppingComponent implements OnInit, AfterViewInit {

  @ViewChild('carSearchInput') carSearchInput!: ElementRef;

  public showSearches: boolean = false;
  public isSearching:boolean = false;
  public searchedProduct: any = [];
  public dataSearch: any[] = [];
  public currentDate = new Date();
  public selectedProduct: Product = {name: '', co2ByKg: 0, weight: 1, date: new Date(), quantity: 1};
  public dbProducts: Product[] = [];
  public formatDate!: any;
  public loadingData = false;

  constructor(private http: HttpClient, private shoppingService: ShoppingService, public toastService: ToastService, private graphService: GraphService) {
    console.log(this.selectedProduct);
    // this.selectedProduct.date = this.currentDate.getFullYear() + '-' + (this.currentDate.getMonth() + 1) + '-' + this.currentDate.getDate();
  }

  ngOnInit() {
    this.graphService.setD3Locale(); // initiate date 
    this.loadingData = true;
    this.shoppingService.getProducts().subscribe({
      next: (val) => {
        if (val && val.data) {
          this.loadingData = false;
          this.formatDate = this.graphService.d3Locale.format("%-d %b %Y à %H:%M");
          this.dbProducts = JSON.parse(val.data);
          console.log(val.data);
        }
      },
      error: (error) => {
        console.log(error);
    }})
  }


  ngAfterViewInit(): void {
    this.productSearch();
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
    if (!this.selectedProduct || this.selectedProduct.weight === null ||  isNaN(this.selectedProduct.weight)) {
      console.log('prout');
      this.toastService.handleToast(toastType.Error, 'Valeur du poids incorrecte !');
      return;
    }

    if (this.dbProducts && this.dbProducts.length === 0) {
      this.shoppingService.saveProduct({
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
  
          }
        },
        error: (error) => {
          console.log(error);
      }});
    } else {
      this.dbProducts.push(this.selectedProduct);
      this.shoppingService.updateProduct({
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
  
          }
        },
        error: (error) => {
          console.log(error);
      }});
    }
  }

  public removeProduct(index: number, product: Product) {
    const trueIndex = this.dbProducts.length - index - 1; // cause ng for reverse
    this.dbProducts.splice(trueIndex, 1);
    this.shoppingService.updateProduct({
      'category': 'shopping',
      'data': JSON.stringify(this.dbProducts)
    }).subscribe({
      next: (data: Product[]) => {
        this.toastService.handleToast(toastType.Info, product.name + ' Supprimé !');
      },
      error: () => {

      }
    });
  }

}
