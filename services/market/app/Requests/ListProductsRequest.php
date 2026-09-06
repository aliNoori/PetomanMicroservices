<?php

namespace App\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
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