export type RotationProduct = { id: string; categoryId: string; images: string[] };
export class ProductRotation<T extends RotationProduct> {
  private products = new Map<string, T>();
  private failed = new Set<string>();
  private lastPhoto = new Map<string, string>();
  private order: string[] = [];
  private index = 0;
  private image = '';
  constructor(private random = Math.random) {}
  private images(product: T) {
    return [...new Set((product.images || []).filter(url => typeof url === 'string' && url.trim()).map(url => url.trim()))]
      .filter(url => /^(https?:\/\/|data:image\/|blob:|\/[^/])/i.test(url) && !this.failed.has(url));
  }
  private shuffle<V>(rows: V[]): V[] {
    const result = [...rows];
    for(let i=result.length-1;i>0;i--) {const j=Math.floor(this.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  private cycle(last?: string) {
    const lastImage=this.image;
    const groups = new Map<string,string[]>();
    for(const product of this.products.values()) {
      const group=groups.get(product.categoryId)||[];group.push(product.id);groups.set(product.categoryId,group);
    }
    const decks=this.shuffle([...groups.values()].map(group=>this.shuffle(group)));
    this.order=[];
    while(decks.some(deck=>deck.length)) for(const deck of decks) {const id=deck.pop();if(id)this.order.push(id);}
    if(this.order.length>1 && this.order[0]===last) [this.order[0],this.order[1]]=[this.order[1],this.order[0]];
    const alternative=this.order.findIndex(id=>id!==last && this.images(this.products.get(id)!).some(image=>image!==lastImage));
    if(alternative>0) [this.order[0],this.order[alternative]]=[this.order[alternative],this.order[0]];
    this.index=0;
    this.choosePhoto(lastImage);
  }
  private choosePhoto(avoid?: string) {
    const product=this.products.get(this.order[this.index]);
    if(!product) {this.image='';return;}
    const images=this.images(product), previous=this.lastPhoto.get(product.id);
    const previousIndex=previous ? images.indexOf(previous) : -1;
    this.image=images[previousIndex<0?Math.floor(this.random()*images.length):(previousIndex+1)%images.length] || '';
    if(this.image===avoid && images.length>1) this.image=images[(images.indexOf(this.image)+1)%images.length];
    this.lastPhoto.set(product.id,this.image);
  }
  sync(products: T[]) {
    const current=this.order[this.index], preceding=this.order.slice(0,this.index);
    this.products=new Map(products.filter(product=>this.images(product).length).map(product=>[product.id,product]));
    this.order=this.order.filter(id=>this.products.has(id));
    const added=this.shuffle([...this.products.keys()].filter(id=>!this.order.includes(id)));
    this.order.push(...added);
    if(!current && this.order.length) {this.cycle();return;}
    const retained=this.order.indexOf(current);
    this.index=retained>=0?retained:Math.min(preceding.filter(id=>this.products.has(id)).length,Math.max(0,this.order.length-1));
    const product=this.products.get(this.order[this.index]);
    if(retained<0 || !product || !this.images(product).includes(this.image)) this.choosePhoto();
  }
  next() {
    const last=this.order[this.index];
    if(this.index+1>=this.order.length) this.cycle(last);
    else {this.index++;this.choosePhoto();}
  }
  select(index: number) {
    if(index<0 || index>=this.order.length) return;
    this.index=index;this.choosePhoto();
  }
  selectPhoto(image: string) {
    const product=this.products.get(this.order[this.index]);
    if(product && this.images(product).includes(image)) {this.image=image;this.lastPhoto.set(product.id,image);}
  }
  rejectImage(image: string) {
    if(image!==this.image) return;
    this.failed.add(image);
    const product=this.products.get(this.order[this.index]);
    if(product && this.images(product).length) this.choosePhoto();
    else this.sync([...this.products.values()]);
  }
  snapshot() {
    return {products:this.order.map(id=>this.products.get(id)!),index:this.index,image:this.image,
      images:this.products.get(this.order[this.index]) ? this.images(this.products.get(this.order[this.index])!) : []};
  }
}
