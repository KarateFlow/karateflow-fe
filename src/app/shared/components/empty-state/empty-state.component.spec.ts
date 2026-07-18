import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';
import { Component } from '@angular/core';

@Component({
  template: `
    <app-empty-state title="Test Title" message="Test Message">
      <div icon>Custom Icon</div>
      <div actions>Custom Actions</div>
    </app-empty-state>
  `,
  imports: [EmptyStateComponent]
})
class TestHostComponent {}

describe('EmptyStateComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent, TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
