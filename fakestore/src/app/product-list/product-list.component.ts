import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  productForm: FormGroup;
  isFormVisible: boolean = false;
  currentProduct: Product | null = null;  // For holding the product being edited
  productLimit: number = 10; // Default limit
  categories: string[] = ['Electronics', 'Clothing', 'Books', 'Home']; // Example categories
  selectedCategory: string = ''; // Property for selected category
  selectedSortOrder: string = ''; // Property for selected sort order

  constructor(private productService: ProductService, private fb: FormBuilder) {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      image: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadLimitedProducts(this.productLimit);
  }

  loadAllProducts(): void {
    this.productService.getAllProducts().subscribe(
      data => {
        this.products = data;
      },
      error => {
        console.error('Error fetching products:', error);
      }
    );
  }

  addProduct(): void {
    if (this.productForm.valid) {
      this.productService.addProduct(this.productForm.value).subscribe(
        newProduct => {
          this.products.push(newProduct);
          this.productForm.reset();
          this.isFormVisible = false;
          this.currentProduct = null;  // Clear current product
        },
        error => {
          console.error('Error adding product:', error);
        }
      );
    }
  }

  deleteProduct(productId: number | undefined): void {
    if (productId !== undefined) {
      this.productService.deleteProduct(productId).subscribe(
        () => {
          this.products = this.products.filter(product => product.id !== productId);
        },
        error => {
          console.error('Error deleting product:', error);
        }
      );
    } else {
      console.error('Product ID is undefined');
    }
  }

  editProduct(product: Product): void {
    this.currentProduct = product;
    this.productForm.setValue({
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.image
    });
    this.isFormVisible = true;  // Show form for updating
  }

  updateProduct(): void {
    if (this.productForm.valid && this.currentProduct) {
      const updatedProduct = { ...this.currentProduct, ...this.productForm.value };
      this.productService.updateProduct(updatedProduct.id!, updatedProduct).subscribe(
        response => {
          const index = this.products.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            this.products[index] = response;
          }
          this.productForm.reset();
          this.isFormVisible = false;
          this.currentProduct = null;  // Clear current product
        },
        error => {
          console.error('Error updating product:', error);
        }
      );
    }
  }

  loadLimitedProducts(limit: number): void {
    this.productService.getLimitedProducts(limit).subscribe(
      data => {
        this.products = data;
        this.applyFilters();
      },
      error => {
        console.error('Error loading limited products:', error);
      }
    );
  }

  loadSortedProducts(order: 'asc' | 'desc'): void {
    this.productService.getAllProducts().subscribe(
      data => {
        this.products = data.sort((a, b) => {
          return order === 'asc' ? a.price - b.price : b.price - a.price;
        });
        this.applyFilters();
      },
      error => {
        console.error('Error loading sorted products:', error);
      }
    );
  }

  loadProductsByCategory(category: string): void {
    this.productService.getProductsByCategory(category).subscribe(
      data => {
        this.products = data;
        this.applyFilters();
      },
      error => {
        console.error('Error loading products by category:', error);
      }
    );
  }

  applyFilters(): void {
    if (this.selectedCategory) {
      this.products = this.products.filter(product => product.category === this.selectedCategory);
    }
    if (this.selectedSortOrder) {
      this.products.sort((a, b) => {
        return this.selectedSortOrder === 'price-asc' ? a.price - b.price : b.price - a.price;
      });
    }
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
  }

  onCategoryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCategory = selectElement.value;
    this.loadProductsByCategory(this.selectedCategory);
  }

  onSortChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedSortOrder = selectElement.value;
    this.loadSortedProducts(this.selectedSortOrder.includes('asc') ? 'asc' : 'desc');
  }
}

// Define the Product interface directly in the component file
interface Product {
  id?: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
}
