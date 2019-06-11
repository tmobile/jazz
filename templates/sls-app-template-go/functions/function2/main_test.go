/**
Go Template Project
@author:
@version: 1.0
 **/

package main

import (
	"context"
	"reflect"
	"testing"
)

func TestHandler(t *testing.T) {
	type args struct {
		ctx   context.Context
		event map[string]interface{}
	}
	tests := []struct {
		name    string
		args    args
		want    Response
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Handler(tt.args.ctx, tt.args.event)
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
