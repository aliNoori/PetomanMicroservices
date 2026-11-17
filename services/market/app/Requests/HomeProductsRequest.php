<?php

namespace App\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HomeProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'tenant_ids.*' => [
                'required',
                'string',
                'uuid',
                'distinct',
            ],

            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],

            'cursor' => [
                'sometimes',
                'nullable',
                'string',
                'max:2048',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('per_page')) {
            $this->merge([
                'per_page' => (int) $this->input('per_page'),
            ]);
        }
    }
}
