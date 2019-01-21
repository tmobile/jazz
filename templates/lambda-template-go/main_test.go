package main

import (
	"api-template-go/models"
	"reflect"
	"testing"
)

func TestHandler(t *testing.T) {
	type args struct {
		request models.Request
	}
	tests := []struct {
		name    string
		args    args
		want    models.Response
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Handler(tt.args.request)
			if (err != nil) != tt.wantErr {
				t.Errorf("Handler() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Handler() = %v, want %v", got, tt.want)
			}
		})
	}
}
