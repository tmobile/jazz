import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { NavigationBarComponent } from '../secondary-components/navigation-bar/navigation-bar.component';
import { SearchBoxComponent } from '../primary-components/search-box/search-box.component';
import { JazzToasterComponent } from '../secondary-components/jazz-toaster/jazz-toaster.component';
import { MyFilterPipe } from '../primary-components/custom-filter';
import { BtnPrimaryWithIconComponent } from '../primary-components/btn-primary-with-icon/btn-primary-with-icon.component';
import { JazzHeaderComponent } from '../secondary-components/jazz-header/jazz-header.component';
import { JazzTableComponent } from '../secondary-components/jazz-table/jazz-table.component';
import { TableTemplateComponent } from '../secondary-components/table-template/table-template.component';
import { MobileSecondaryTabComponent } from '../secondary-components/mobile-secondary-tab/mobile-secondary-tab.component';
import { DropdownComponent } from '../primary-components/dropdown/dropdown.component';
import { CheckboxGroupComponent } from '../primary-components/checkbox-group/checkbox-group.component';
import { CheckboxGroupRegionComponent } from '../primary-components/checkbox-group-region/checkbox-group-region.component';
import { RadioGroupComponent } from '../primary-components/radio-group/radio-group.component';
import { FilterTagComponent } from '../primary-components/filter-tag/filter-tag.component';
import { InputComponent } from '../primary-components/input/input.component';
import { BtnJazzPrimaryComponent } from '../primary-components/btn-jazz-primary/btn-jazz-primary.component';
import { SidebarComponent } from '../secondary-components/sidebar/sidebar.component';
import { OnlyNumber } from '../secondary-components/create-service/onlyNumbers';
import { BtnJazzSecondaryComponent } from '../primary-components/btn-jazz-secondary/btn-jazz-secondary.component';
import { DaterangePickerComponent } from '../primary-components/daterange-picker/daterange-picker.component';
import { FiltersComponent } from '../secondary-components/filters/filters.component';
import { FilterTagsComponent } from '../secondary-components/filter-tags/filter-tags.component';
import { FilterTagsServicesComponent } from '../secondary-components/filter-tags-services/filter-tags-services.component';
import { TabsComponent } from '../primary-components/tabs/tabs.component';
import { JenkinsStatusComponent } from '../pages/jenkins-status/jenkins-status.component';
import { FocusDirective } from '../secondary-components/create-service/focus.directive';
import { JazzMobHeaderModule } from '../secondary-components/jazz-mob-header/jazz-mob-header.module';
import { ClickOutsideDirective } from '../secondary-components/jazz-header/outside-click';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'ngx-dropdown';
import { PopoverModule } from 'ngx-popover';
import { ChartsModule } from 'ng2-charts';
import { DatePickerModule } from '../primary-components/daterange-picker/ng2-datepicker';
import { MomentModule } from 'angular2-moment';
import { environment } from '../../environments/environment';


import { LoginComponent } from '../pages/login/oss/login.component';
import { LineGraphComponent } from '../secondary-components/line-graph/line-graph.component';
import { SideTileFixedComponent } from '../secondary-components/side-tile-fixed/side-tile-fixed.component';
import { FooterComponent } from '../secondary-components/footer/footer.component';
import { OverviewSidebarComponent } from './../secondary-components/overview-sidebar/overview-sidebar.component';
import { AdvancedFiltersComponentOSS } from '../secondary-components/advanced-filters/OSS/advanced-filters.component';
import { AdvancedFiltersComponent } from '../secondary-components/advanced-filters/internal/advanced-filters.component';
import { AdvFilters } from '../adv-filter.directive';
import { SafeHtmlPipe } from "../core/pipes/safe-html.pipe";
import { SafeUrlPipe } from "../core/pipes/safe-url.pipe";
import { ReportIssueComponent } from '../primary-components/report-issue/report-issue.component';
import { ChartjsLinegraphComponent } from "../secondary-components/chartjs-linegraph/chartjs-linegraph.component";
import { FilterModalComponent } from "../secondary-components/filter-modal/filter-modal.component";
import { FilterMetricsComponent } from '../secondary-components/filter-metrics/filter-metrics.component';
import { ServiceMetricsComponent } from "../pages/service-metrics/service-metrics.component";
import { MetricsCarouselComponent } from "../secondary-components/metrics-carousel/metrics-carousel.component";
import { RouterModule } from "@angular/router";
import { Error403Component } from "../pages/error403/error403.component";
import { RadioCheckboxComponent } from "../primary-components/radio-checkbox/radio-checkbox.component";
import {OrderByPipe} from '../core/pipes/order-by.pipe';
import { CopyElementComponent } from '../secondary-components/copy-element/copy-element.component';


@NgModule({
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    DropdownModule,
    DatePickerModule,
    MomentModule,
    PopoverModule,
    ChartsModule,
    JazzMobHeaderModule,
  ],
  declarations: [
    BtnJazzPrimaryComponent,
    BtnJazzSecondaryComponent,
    JazzHeaderComponent,
    JazzTableComponent,
    TabsComponent,
    DropdownComponent,
    LoginComponent,
    SidebarComponent,
    InputComponent,
    MyFilterPipe,
    BtnPrimaryWithIconComponent,
    NavigationBarComponent,
    FocusDirective,
    OnlyNumber,
    ClickOutsideDirective,
    FiltersComponent,
    FilterTagsServicesComponent,
    FilterTagsComponent,
    TableTemplateComponent,
    SearchBoxComponent,
    MobileSecondaryTabComponent,
    JazzToasterComponent,
    DaterangePickerComponent,
    JenkinsStatusComponent,
    LineGraphComponent,
    SideTileFixedComponent,
    FooterComponent,
    OverviewSidebarComponent,
    AdvancedFiltersComponentOSS,
    AdvancedFiltersComponent,
    AdvFilters,
    SafeHtmlPipe,
    SafeUrlPipe,
    ReportIssueComponent,
    MetricsCarouselComponent,
    ChartjsLinegraphComponent,
    FilterModalComponent,
    FilterMetricsComponent,
    ServiceMetricsComponent,
    RadioCheckboxComponent,
    RadioGroupComponent,
    CheckboxGroupComponent,
    CheckboxGroupRegionComponent,
    FilterTagComponent,
    Error403Component,
    OrderByPipe,
    CopyElementComponent,
  ],
  exports: [
    BtnJazzPrimaryComponent,
    BtnJazzSecondaryComponent,
    JazzHeaderComponent,
    JazzTableComponent,
    DropdownComponent,
    RadioGroupComponent,
    CheckboxGroupComponent,
    CheckboxGroupRegionComponent,
    FilterTagComponent,
    TabsComponent,
    SidebarComponent,
    InputComponent,
    LoginComponent,
    MyFilterPipe,
    BtnPrimaryWithIconComponent,
    NavigationBarComponent,
    FocusDirective,
    OnlyNumber,
    ClickOutsideDirective,
    FiltersComponent,
    TableTemplateComponent,
    SearchBoxComponent,
    MobileSecondaryTabComponent,
    JazzToasterComponent,
    DaterangePickerComponent,
    JenkinsStatusComponent,
    LineGraphComponent,
    FilterTagsServicesComponent,
    FilterTagsComponent,
    SideTileFixedComponent,
    FooterComponent,
    OverviewSidebarComponent,
    AdvancedFiltersComponentOSS,
    AdvancedFiltersComponent,
    AdvFilters,
    SafeHtmlPipe,
    SafeUrlPipe,
    ReportIssueComponent,
    MetricsCarouselComponent,
    ChartjsLinegraphComponent,
    FilterModalComponent,
    FilterMetricsComponent,
    ServiceMetricsComponent,
    Error403Component,
    RadioCheckboxComponent,
    RadioGroupComponent,
    OrderByPipe,
    CopyElementComponent,
  ],
  entryComponents: [
    AdvancedFiltersComponentOSS,
    AdvancedFiltersComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class SharedModule {
}
